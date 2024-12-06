const textPeau = "peau"
const textSang = "sang"
const textPoumons = "poumons"
const corpsImage = document.querySelector("#corps")
const zoomImage = document.querySelector(".zoom-image");
const righttext = document.querySelector(".right-text");
const diapo = document.querySelector("#diapo")
righttext.innerText = textPeau

    window.addEventListener("scroll", function () {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const scrollPercent = (scrollY / (docHeight - windowHeight));



    let scale = 1 + (scrollPercent);
    //righttext.style.opacity = 0;
    zoomImage.style.transform = `scale(${scale})`;
    const scrollThresholdPeau = 0.5;
    const scrollThresholdPoumons = 0.7;
    diapo.src = "image/peau"

    if(scrollPercent>=scrollThresholdPoumons){
        corpsImage.src ="img/corps-humain.webp"
        righttext.innerText = textPoumons
        corpsImage.style.transform =` translateY(450px) scale(${1+3*scrollPercent})`
        diapo.src = "image/poumons"
    }
    else if (scrollPercent >= scrollThresholdPeau) {
        corpsImage.src ="img/corps-humain.webp"
        righttext.innerText = textSang
        diapo.src = "image/sang"
    }
    else{
        corpsImage.src ="img/Corps-peau-humain.png"
        righttext.innerText = textPeau
        diapo.src = "image/peau"
    }
});
