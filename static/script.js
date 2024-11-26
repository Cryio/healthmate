const form = document.getElementById('chat-form');
const chatBox = document.getElementById('chat-box');
const promptInput = document.getElementById('user-prompt');
const themeToggle = document.getElementById('theme-toggle');

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    themeToggle.checked = savedTheme === 'dark';

    const welcome=document.getElementById('welcome-message');
    const storedName = localStorage.getItem('Name');
    if (storedName) {
        welcome.textContent=`Welcome, ${storedName}`;
    }
});

// Theme toggle event
themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? 'dark' : 'light';
    setTheme(newTheme);
});

// Set theme function
function setTheme(theme) {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
}

// Chat form submission and chat handling remain the same
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userInput = promptInput.value.trim();
    if (!userInput) return;

    appendMessage('user', userInput);

    promptInput.value = '';
    resizeTextarea();

    try {
        appendTypingIndicator();

        const response = await fetch('/generate-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: userInput }),
        });

        const data = await response.json();

        removeTypingIndicator();

        if (data.generated_text) {
            appendFormattedMessage('model', data.generated_text);
        } else if (data.error) {
            appendMessage('model', `Error: ${data.error}`);
        }
    } catch (error) {
        appendMessage('model', 'An error occurred while generating text.');
    }
});

function appendMessage(sender, message) {
    const chatMessage = document.createElement('div');
    chatMessage.classList.add('chat', sender);

    const messageContent = document.createElement('p');
    messageContent.textContent = message;
    chatMessage.appendChild(messageContent);

    chatBox.appendChild(chatMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendFormattedMessage(sender, message) {
    const chatMessage = document.createElement('div');
    chatMessage.classList.add('chat', sender);

    const messageContent = document.createElement('p');
    const formattedMessage = formatResponse(message);
    messageContent.innerHTML = formattedMessage;
    chatMessage.appendChild(messageContent);

    chatBox.appendChild(chatMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function formatResponse(response) {
    response = response
        .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    return response;
}

function resizeTextarea() {
    promptInput.style.height = 'auto';
    promptInput.style.height = `${promptInput.scrollHeight}px`;
}

function appendTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.classList.add('chat', 'model');

    const typingText = document.createElement('p');
    typingText.textContent = 'AI bot is Typing...';
    typingIndicator.appendChild(typingText);

    chatBox.appendChild(typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) typingIndicator.remove();
}
