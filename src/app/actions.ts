"use server";

import { redirect } from "next/navigation";
import { clearEditorCookie, editingConfigured, isEditor, passwordMatches, safeNext, setEditorCookie } from "@/lib/auth";
import { toJpeg } from "@/lib/images";
import {
  addLink,
  addPhoto,
  deletePhoto,
  deleteRecipe,
  insertRecipe,
  parseId,
  recipeInputFromForm,
  removeLink,
  updateRecipe,
  ValidationError,
} from "@/lib/recipes";

async function denyUnlessEditor(next: string): Promise<void> {
  if (!(await isEditor())) redirect(`/login?next=${encodeURIComponent(safeNext(next))}`);
}

function idFrom(formData: FormData, name: string): number | null {
  const value = formData.get(name);
  return parseId(typeof value === "string" ? value : "");
}

export async function login(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? "/"));
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    redirect(`/login?error=${editingConfigured() ? "1" : "off"}&next=${encodeURIComponent(next)}`);
  }
  await setEditorCookie();
  redirect(next);
}

export async function logout() {
  await clearEditorCookie();
  redirect("/");
}

export async function createRecipeAction(formData: FormData) {
  await denyUnlessEditor("/recipes/new");
  try {
    const id = await insertRecipe(recipeInputFromForm(formData));
    redirect(`/recipes/${id}`);
  } catch (error) {
    if (error instanceof ValidationError) {
      redirect(`/recipes/new?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
}

export async function updateRecipeAction(formData: FormData) {
  const id = idFrom(formData, "id");
  if (!id) redirect("/");
  await denyUnlessEditor(`/recipes/${id}/edit`);
  try {
    const updated = await updateRecipe(id, recipeInputFromForm(formData));
    if (!updated) redirect("/");
    redirect(`/recipes/${id}`);
  } catch (error) {
    if (error instanceof ValidationError) {
      redirect(`/recipes/${id}/edit?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
}

export async function deleteRecipeAction(formData: FormData) {
  const id = idFrom(formData, "id");
  if (!id) redirect("/");
  await denyUnlessEditor(`/recipes/${id}/edit`);
  if (formData.get("confirm") !== "yes") {
    redirect(`/recipes/${id}/edit?error=${encodeURIComponent("Check the box to delete this recipe.")}`);
  }
  await deleteRecipe(id);
  redirect("/");
}

export async function addPhotoAction(formData: FormData) {
  const id = idFrom(formData, "recipe");
  if (!id) redirect("/");
  await denyUnlessEditor(`/recipes/${id}/edit`);
  const file = formData.get("photo");
  try {
    if (!(file instanceof File) || file.size === 0) throw new ValidationError("Choose a photo.");
    if (file.size > 12 * 1024 * 1024) throw new ValidationError("That photo is larger than 12 MB.");
    let jpeg: Buffer;
    try {
      jpeg = await toJpeg(Buffer.from(await file.arrayBuffer()));
    } catch {
      throw new ValidationError("Could not read that photo. Try a JPEG.");
    }
    await addPhoto(id, jpeg);
  } catch (error) {
    if (error instanceof ValidationError) {
      redirect(`/recipes/${id}/edit?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
  redirect(`/recipes/${id}/edit`);
}

export async function deletePhotoAction(formData: FormData) {
  const recipeId = idFrom(formData, "recipe");
  const photoId = idFrom(formData, "photo");
  if (!recipeId || !photoId) redirect("/");
  await denyUnlessEditor(`/recipes/${recipeId}/edit`);
  await deletePhoto(recipeId, photoId);
  redirect(`/recipes/${recipeId}/edit`);
}

export async function addLinkAction(formData: FormData) {
  const src = idFrom(formData, "src");
  const dest = idFrom(formData, "dest");
  if (!src || !dest) redirect("/");
  await denyUnlessEditor(`/recipes/${src}/edit`);
  try {
    await addLink(src, dest);
  } catch (error) {
    if (error instanceof ValidationError) {
      redirect(`/recipes/${src}/edit?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
  redirect(`/recipes/${src}/edit`);
}

export async function removeLinkAction(formData: FormData) {
  const src = idFrom(formData, "src");
  const dest = idFrom(formData, "dest");
  if (!src || !dest) redirect("/");
  await denyUnlessEditor(`/recipes/${src}/edit`);
  await removeLink(src, dest);
  redirect(`/recipes/${src}/edit`);
}
