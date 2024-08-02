const express = require('express');
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const { exec } = require('child_process');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // Add this line to import uuid
const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 9000;

app.use(bodyParser.json());
app.use(cors());

let scheduledMessages = [];  // Store scheduled messages

// Convert scheduled message to a serializable format
const serializeMessage = (msg) => ({
  id: msg.id,
  phone: msg.phone,
  message: msg.message,
  time: msg.time
});

// Schedule a message
app.post('/api/schedule', (req, res) => {
  const { phone, message, time } = req.body;

  // Generate a unique ID for each message
  const id = uuid.v4();
  const [hour, minute] = time.split(':').map(Number);
  
  // Schedule new job
  const job = schedule.scheduleJob({ hour, minute }, function() {
    exec(`python send_message.py ${phone} "${message}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
  });

  // Add the new message to the list
  scheduledMessages.push({ id, phone, message, time, job });
  res.status(200).json({ id });  // Return the ID of the scheduled message
});

// Get scheduled messages
app.get('/api/messages', (req, res) => {
  const serializableMessages = scheduledMessages.map(serializeMessage);
  res.json(serializableMessages);
});

// Delete a scheduled message
app.delete('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  const existingMessage = scheduledMessages.find(msg => msg.id === id);
  if (existingMessage) {
    existingMessage.job.cancel();  // Cancel the job
    scheduledMessages = scheduledMessages.filter(msg => msg.id !== id);  // Remove from list
    res.status(200).send('Message deleted successfully');
  } else {
    res.status(404).send('Message not found');
  }
});

// Update a scheduled message
app.put('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  const { phone, message, time } = req.body;
  
  const existingMessage = scheduledMessages.find(msg => msg.id === id);
  if (existingMessage) {
    // Cancel existing job
    existingMessage.job.cancel();

    // Schedule new job with updated details
    const [hour, minute] = time.split(':').map(Number);
    const newJob = schedule.scheduleJob({ hour, minute }, function() {
      exec(`python send_message.py ${phone} "${message}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing script: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
      });
    });

    // Update message details
    existingMessage.phone = phone;
    existingMessage.message = message;
    existingMessage.time = time;
    existingMessage.job = newJob;  // Update job reference

    res.status(200).send('Message updated successfully');
  } else {
    res.status(404).send('Message not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
