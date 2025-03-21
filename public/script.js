const db = new PouchDB("images");

async function updateText(code) {
  const folder = document.getElementById("folder");
  const allImages = document.getElementById("images");
  allImages.innerHTML = "";

  const nbFiles = folder.files.length;
  console.log(nbFiles);

  const docs = await db.allDocs();

  for (const doc of docs.rows) {
    await db.remove(doc.doc);
  }

  if (nbFiles > 0) {
    allImages.classList.add("h-full");
  } else {
    allImages.classList.remove("h-full");
  }

  for (let i = 0; i < nbFiles; i++) {
    const reader = new FileReader();

    reader.onload = async (event) => {
      const blob = new Blob([event.target.result]);

      const dbImage = {
        _id: `image_${i}`,
        _attachments: {
          [folder.files[i].name]: {
            content_type: folder.files[i].type,
            data: blob,
          },
        },
      };

      await db.put(dbImage);

      addImageToCreateDiv(`image_${i}`);
    };

    reader.readAsArrayBuffer(folder.files.item(i));
  }

  images(code, nbFiles);
}

async function addImageToCreateDiv(id) {
  const allImages = document.getElementById("images");

  const doc = await db.get(id);
  const fileName = Object.keys(doc._attachments)[0];
  const blob = await db.getAttachment(id, fileName);

  const div = document.createElement("div");
  div.classList.add("bg-black/10", "h-15", "w-full", "p-1");

  const img = document.createElement("img");
  img.classList.add("object-contain", "h-full", "w-full");
  img.src = URL.createObjectURL(blob);

  div.appendChild(img);
  allImages.appendChild(div);
}

async function getLocalImage(id, number) {
  const img = document.getElementById(id);

  const doc = await db.get(`image_${number}`);
  const fileName = Object.keys(doc._attachments)[0];

  const blob = await db.getAttachment(`image_${number}`, fileName);
  const url = URL.createObjectURL(blob);
  img.src = url;
}

const load = document.querySelectorAll("img[image]");

if (load != null) {
  load.forEach((img) => {
    getLocalImage(img.id, img.attributes.image.value);
  });
}

async function loadImages() {
  const docs = await db.allDocs();

  if (docs.rows.length > 0) {
    document.getElementById("images").classList.add("h-full");
  }

  for (const doc of docs.rows) {
    addImageToCreateDiv(doc.id);
  }
}

loadImages();
