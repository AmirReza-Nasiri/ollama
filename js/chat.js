const messagesDiv = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const modelSelector = document.getElementById('modelSelector');

async function loadModels() {
    try {
        const response = await fetch('http://localhost:11434/api/tags', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        modelSelector.innerHTML = data.models
            .map(model => `<option value="${model.name}">${model.name}</option>`)
            .join('');
    } catch (error) {
        console.error('Error loading models:', error);
        modelSelector.innerHTML = '<option value="mistral">mistral</option>';
    }
}

function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage() {
    const message = userInput.value.trim();
    const selectedModel = modelSelector.value || 'mistral';
    
    if (!message) return;

    addMessage(message, true);
    userInput.value = '';

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: selectedModel,
                prompt: message
            })
        });

        const reader = response.body.getReader();
        let botResponse = '';

        while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');
            
            lines.forEach(line => {
                if (line.trim() !== '') {
                    const json = JSON.parse(line);
                    if (json.response) {
                        botResponse += json.response;
                    }
                }
            });
        }

        addMessage(botResponse, false);
    } catch (error) {
        console.error('Error:', error);
        addMessage('Error: Could not connect to Ollama service', false);
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Load models when page loads
loadModels();
