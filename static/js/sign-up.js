const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", function () {
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
});

let email = document.querySelector("#number");
let password = document.getElementById("password");

const setJointError = (msg) => {
  const jointErrorContainer = document.getElementById("jointError");
  jointErrorContainer.innerHTML = `<span style="font-size: 0.8em; color: red;">${msg}</span>`;
};

const clearJointError = () => {
  const jointErrorContainer = document.getElementById("jointError");
  jointErrorContainer.innerHTML = "";
};

const mailFormat = (e) => {
  const re = /\w+@\w+\.\w+/;
  return re.test(String(e).toLowerCase());
};


const passFormat = (p) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@#$!%*?&]{8,96}$/;
  return re.test(p);
};


function validation() {
  const mail = email.value.trim();
  const pass = password.value.trim();

  clearJointError(); 

  let errors = []; 


  if (mail === "") {
    errors.push("Email is required");
  } else if (!mailFormat(mail)) {
    errors.push("Please enter a valid email");
  }

  if (pass === "") {
    errors.push("Password is required");
  } else if (!passFormat(pass)) {
    errors.push("Password must be at least 8 characters long, include at least 1 uppercase letter, 1 lowercase letter, and 1 number.");
  }


  if (errors.length > 0) {
    setJointError(errors.join(" | ")); 
  } else {

    let users = JSON.parse(localStorage.getItem("Users")) || [];
    users.push({ email: mail, password: pass });
    localStorage.setItem("Users", JSON.stringify(users));
    alert("User signed up successfully!");
    window.location.href="http://172.19.20.211:5000"
  }
}

let signupButton = document.querySelector(".sign-up");
signupButton.addEventListener("click", validation);
