const password = document.getElementById("password");

const toggle = document.getElementById("togglePassword");

toggle.addEventListener("click",()=>{

    if(password.type==="password"){

        password.type="text";

        toggle.innerHTML='<i class="bi bi-eye-slash ui-icon" aria-hidden="true"></i>';

    }else{

        password.type="password";

        toggle.innerHTML='<i class="bi bi-eye ui-icon" aria-hidden="true"></i>';

    }

});

const form=document.querySelector("form");

const boton=document.getElementById("btnLogin");

const texto=document.getElementById("btnText");

form.addEventListener("submit",()=>{

    boton.disabled=true;

    texto.innerHTML="Ingresando...";

});
