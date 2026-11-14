export async function loadingPhotos(area) {
  if(['strip','north'].includes(area))return;
  try {
    const response=await fetch(`./assets/splash/${area}/views.json`);if(!response.ok)return;
    const views=await response.json();let i=Math.floor(Math.random()*views.length);
    const show=()=>{document.getElementById('intro').style.setProperty('--art',`url("./assets/splash/${area}/${i+1}.jpg")`);document.getElementById('fact').textContent=views[i].caption;};
    show();const timer=setInterval(()=>{if(document.body.classList.contains('playing')){clearInterval(timer);return;}i=(i+1)%views.length;show();},4500);
  }catch{/* Progress and retry controls remain usable when an image is unavailable. */}
}
