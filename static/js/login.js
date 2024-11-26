// Toggle Password Visibility
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", function () {
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
});

// Variables for form elements
let loginEmail = document.getElementById("email-address");
let loginPassword = document.getElementById("password");
let errorContainer = document.getElementById("error-messages");
let box = document.querySelector(".box");

// Error handling functions
const setError = (ele, msg) => {
  let box = ele.parentElement;
  let error = box.querySelector(".error");

  if (!error) {
    error = document.createElement("div");
    error.classList.add("error");
    box.appendChild(error);
  }

  error.innerHTML = `<span style="font-size: 0.8em;">${msg}</span>`;
  box.classList.add("error");
  box.classList.remove("success");
};

const clearError = (ele) => {
  let box = ele.parentElement;
  let error = box.querySelector(".error");
  if (error) {
    error.innerHTML = "";
    box.classList.remove("error");
    box.classList.add("success");
  }
};

// Validation functions
const mailFormat = (email) => {
  const re = /\w+@\w+\.\w+/;
  return re.test(String(email).toLowerCase());
};

const passFormat = (password) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@#$!%*?&]{8,96}$/;
  return re.test(password);
};

// Sign-In Function with validation
function signIn() {
  const email = loginEmail.value;
  const password = loginPassword.value;
  errorContainer.innerHTML = ""; // Clear previous error messages

  let errors = []; // Array to collect error messages

  // Validate email format
  if (!mailFormat(email)) {
    errors.push("Please enter a valid email");
  }

  // Validate password format
  if (!passFormat(password)) {
    errors.push(
      "Password must be at least 8 characters long, including upper/lowercase letters and a number"
    );
  }

  if (errors.length > 0) {
    // Display the error messages in the container
    errorContainer.innerHTML = errors.join(" | "); // Display errors in a single line
    // Adjust the height of the container if there are errors
    errorContainer.style.height = `${errors.length * 30}px`; // Adjust height based on number of errors
    box.style.height = "90%";
  } else {
    // Proceed with sign-in logic if no errors
    console.log("Form is valid");
    // Add your custom sign-in logic here (e.g., API calls, user authentication)
    errorContainer.style.height = "0px"; // Reset height if no errors
    alert("Login successful!")
    window.location.href="./index"
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
        window.location.href = "http://192.168.169.154:5000";
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
google.accounts.id.initialize({
  client_id:
    "382357017579-sieojf15iists629u2r5o06d3h92j9ej.apps.googleusercontent.com", // Replace with your actual Google Client ID
  callback: handleCredentialResponse,
});

// Render Google Sign-In button
google.accounts.id.renderButton(
  document.getElementById("google-signin-button"), // This will render inside the div with this ID
  {
    theme: "outline", // Button style (you can change this)
    size: "large", // Button size (you can adjust)
  }
);

// Attach event listener to Sign-In button
let loginButton = document.querySelector(".sign-in");
loginButton.addEventListener("click", signIn); // Ensure to call the signIn function on click
