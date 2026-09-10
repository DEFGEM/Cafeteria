const boton = document.querySelector(".btn-primary");
const formulario = document.getElementById("formUsuario");

boton.addEventListener("click", () => {

    if(formulario.style.display=="block")
        formulario.style.display="none";
    else
        formulario.style.display="block";

});