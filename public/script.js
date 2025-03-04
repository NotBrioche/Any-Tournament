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

    reader.onload = async (event) => {
      const div = document.createElement("div");
      div.classList.add("bg-black/10", "h-15", "w-full");

      const img = document.createElement("img");
      img.classList.add("object-contain", "h-full", "w-full");
      img.src = URL.createObjectURL(new Blob([event.target.result]));

      const dbImage = {
        _id: `image_${i}`,
        _attachements: {
          [folder.files[i].name]: {
            content_type: folder.files[i].type,
            data: event.target.result,
          },
        },
      };

      await db.put(dbImage);

      div.appendChild(img);
      allImages.appendChild(div);
    };

    reader.readAsText(folder.files.item(i));
  }

  images(code, nbFiles);
}

async function getLocalImage(id, number) {
  const img = document.getElementById(id);

  const doc = await db.get(`image_${number}`);
  const fileName = Object.keys(doc._attachments)[0];

  const blob = await db.getAttachment(`image_${number}`, fileName);
  const url = URL.createObjectURL(blob);
  img.src = url;
}

const load = document.querySelectorAll("img");

if (load != null) {
  load.forEach((img) => {
    getLocalImage(img.id, img.attributes.image.value);
  });
}
