// Toggle Password Visibility
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", function () {
  const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
  togglePassword.classList.toggle("visible"); // Optional: Add a class to change the icon
});

// Variables for form elements
const loginEmail = document.getElementById("email-address");
const loginPassword = document.getElementById("password");
const errorContainer = document.getElementById("error-messages");
const box = document.querySelector(".box");

// Error handling functions
const setError = (ele, msg) => {
  let box = ele.parentElement;
  let error = box.querySelector(".error");

  if (!error) {
    error = document.createElement("div");
    error.classList.add("error");
    box.appendChild(error);
  }

  error.innerHTML = `<span style="font-size: 0.8em; color: red;">${msg}</span>`;
  box.classList.add("error");
  box.classList.remove("success");
};

const clearError = (ele) => {
  let box = ele.parentElement;
  let error = box.querySelector(".error");
  if (error) {
    error.remove();
    box.classList.remove("error");
    box.classList.add("success");
  }
};

// Validation functions
const mailFormat = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const passFormat = (password) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@#$!%*?&]{8,96}$/;
  return re.test(password);
};

// Sign-In Function with validation
function signIn() {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  errorContainer.innerHTML = ""; // Clear previous error messages
  errorContainer.style.height = "0px"; // Reset height for errors

  let hasError = false;

  // Validate email format
  if (!mailFormat(email)) {
    setError(loginEmail, "Please enter a valid email");
    hasError = true;
  } else {
    clearError(loginEmail);
  }

  // Validate password format
  if (!passFormat(password)) {
    setError(loginPassword, "Password must be at least 8 characters, including upper/lowercase letters and a number");
    hasError = true;
  } else {
    clearError(loginPassword);
  }

  if (hasError) {
    errorContainer.innerHTML = "Fix the highlighted errors before proceeding.";
    errorContainer.style.height = "auto";
    box.style.height = "90%"; // Adjust box height for error display
  } else {
    // Proceed with sign-in logic if no errors
    console.log("Form is valid");
    alert("Login successful!");
    window.location.href = "./index"; // Redirect to the dashboard
  }
}

// Google OAuth Integration
function handleCredentialResponse(response) {
  console.log("Encoded JWT ID token: " + response.credential);

  // Send token to the server for validation
  fetch("/google-oauth-callback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: response.credential }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert(`Welcome, ${data.name}!`);
        window.location.href = "http://192.168.169.154:5000"; // Redirect after successful login
      } else {
        alert("Google sign-in failed: " + data.error);
      }
    })
    .catch((error) => {
      console.error("Error during Google sign-in:", error);
      alert("An unexpected error occurred. Please try again.");
    });
}

// Initialize Google OAuth
google.accounts.id.renderButton(
  document.getElementById("google-signin-button"), // Ensure this ID matches
  {
    theme: "outline",
    size: "large",
  }
);
console.log("Google sign-in button rendered");


// Attach event listener to Sign-In button
document.querySelector(".sign-in").addEventListener("click", signIn);
