import type { Metadata } from "next";

export const metadata: Metadata = { title: "Logo options" };

const options = [
  "Scored loaf of bread",
  "Wire whisk",
  "Lidded stock pot",
  "Rolling pin",
  "Skillet",
  "Chef's knife",
  "Pie with a slice cut",
  "Croissant",
  "Oven mitt",
  "Waffle",
];

export default function LogosPage() {
  return (
    <>
      <h1>Logo options</h1>
      <p className="lede">Ten cooking marks. The site still uses the current bowl until one of these is chosen.</p>
      <ol className="chooser">
        {options.map((name, index) => {
          const number = index + 1;
          const src = `/logos/${number}.svg`;
          return (
            <li key={number}>
              <span className="chooser-num">{number}</span>
              <div>
                <strong>{name}</strong>
                <div className="chooser-sizes">
                  <span>
                    <img className="favicon" src={src} alt="" />
                    favicon
                  </span>
                  <span>
                    <img className="header" src={src} alt="" />
                    header
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
