// Password Visibility Toggle
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
const mailFormat = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

const passFormat = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@#$!%*?&]{8,96}$/.test(password);

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
    window.location.href = "http://172.19.20.211:5000"; // Redirect to the dashboard
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
        window.location.href = "http://172.19.20.211:5000"; // Redirect after successful login
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
window.onload = function () {
  if (typeof google !== "undefined") {
    google.accounts.id.initialize({
      client_id: "382357017579-sieojf15iists629u2r5o06d3h92j9ej.apps.googleusercontent.com", // Replace with your actual client ID
      callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
      document.getElementById("google-signin-button"), 
      { theme: "outline", size: "large" }  // Customize button size and style
    );
  };
  
  function handleCredentialResponse(response) {
    try {
      const token = response.credential; // Get the JWT token
      console.log("JWT Token:", token);
  
      // Parse the token (optional)
      const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decode JWT
      console.log("Decoded JWT Token:", decodedToken);
      
      // Continue with your sign-in logic here
    } catch (e) {
      console.error("Error during Google sign-in:", e);
    }
  }
  if (typeof google === "undefined") {
    console.error("Google API is not defined. Ensure the script is loaded.");
    alert("Google Sign-In is unavailable at the moment. Please try again later.");
  }
  }


// Attach event listener to Sign-In button
document.querySelector(".sign-in").addEventListener("click", signIn);
