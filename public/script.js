function updateText(code) {
  const folder = document.getElementById("folder");
  const allImages = document.getElementById("images");

  const nbFiles = folder.files.length;
  console.log(nbFiles);

  for (let i = 0; i < nbFiles; i++) {
    const reader = new FileReader();

    reader.onload = (event) => {
      const div = document.createElement("div");
      div.classList.add("bg-black/10", "h-15", "w-full");

      const img = document.createElement("img");
      img.classList.add("object-contain", "h-full", "w-full");
      img.src = event.target.result;

      div.appendChild(img);
      allImages.appendChild(div);
    };

    reader.readAsDataURL(folder.files.item(i));
  }

  images(code, nbFiles);
}

const load = document.getElementById("fromData");

if (load != null) {
  load.src = sessionStorage.getItem("saved");
}
