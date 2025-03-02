const db = new PouchDB("images");
const remoteCouch = false;

async function updateText(code) {
  const folder = document.getElementById("folder");
  const allImages = document.getElementById("images");

  const nbFiles = folder.files.length;
  console.log(nbFiles);

  const docs = await db.allDocs({ include_docs: true });

  for (const doc of docs.rows) {
    await db.remove(doc.doc);
  }

  for (let i = 0; i < nbFiles; i++) {
    const reader = new FileReader();

    reader.onload = (event) => {
      const div = document.createElement("div");
      div.classList.add("bg-black/10", "h-15", "w-full");

      const img = document.createElement("img");
      img.classList.add("object-contain", "h-full", "w-full");
      img.src = event.target.result;

      const dbImage = {
        _id: `image_${i}`,
        image: event.target.result,
      };

      db.put(dbImage);

      div.appendChild(img);
      allImages.appendChild(div);
    };

    reader.readAsDataURL(folder.files.item(i));
  }

  images(code, nbFiles);
}

function getLocalImage(id, number) {
  const img = document.getElementById(id);

  db.get(`image_${number}`).then((doc) => {
    img.src = doc.image;
  });
}

const load = document.querySelectorAll("img");

if (load != null) {
  load.forEach((img) => {
    getLocalImage(img.id, img.attributes.image.value);
  });
}
