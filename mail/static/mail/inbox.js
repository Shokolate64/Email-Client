document.addEventListener('DOMContentLoaded', function() {
    
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    
    
    document.querySelector('#compose-form').onsubmit = send_email;

    
    load_mailbox('inbox');
});


function compose_email() {
    
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}


function send_email(event) {
    event.preventDefault();  

    
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
        })
    })
    .then(response => response.json())
    .then(result => {
        
        if (result.message) {
            console.log("Email sent successfully:", result.message);
            
            load_mailbox('sent');
        } else {
            console.log("Error:", result.error);
        }
    });
}

function load_mailbox(mailbox) {
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#emails-view h3').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;
    document.querySelector('#emails-container').innerHTML = '';

    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        emails.forEach(email => {
            
            const emailDiv = document.createElement('div');
            emailDiv.className = 'email';

            
            const emailDetails = document.createElement('div');
            emailDetails.className = 'email-details';
            emailDetails.innerHTML = `
                <strong>From:</strong> ${email.sender} <br>
                <strong>Subject:</strong> ${email.subject}
            `;

            
            const emailTimestamp = document.createElement('div');
            emailTimestamp.className = 'email-timestamp';
            emailTimestamp.innerText = email.timestamp;

            
            emailDiv.appendChild(emailDetails);
            emailDiv.appendChild(emailTimestamp);

           
            emailDiv.style.backgroundColor = email.read ? 'lightgray' : 'white';

            
            emailDiv.addEventListener('click', () => load_email(email.id));

           
            document.querySelector('#emails-container').append(emailDiv);
        });
    });
}


function load_email(email_id) {
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#emails-container').innerHTML = '';

    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
        const emailDetails = document.createElement('div');
        emailDetails.innerHTML = `
            <strong>From:</strong> ${email.sender} <br>
            <strong>To:</strong> ${email.recipients.join(", ")} <br>
            <strong>Subject:</strong> ${email.subject} <br>
            <strong>Timestamp:</strong> ${email.timestamp} <br><br>
            <p>${email.body}</p>
        `;

        if (!email.read) {
            fetch(`/emails/${email_id}`, {
                method: 'PUT',
                body: JSON.stringify({ read: true })
            });
        }

        
        if (email.sender !== document.querySelector('h2').innerText) {
            const archiveButton = document.createElement('button');
            archiveButton.innerHTML = email.archived ? "Unarchive" : "Archive";
            archiveButton.className = 'google-button'; 
            archiveButton.addEventListener('click', () => {
                fetch(`/emails/${email_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ archived: !email.archived })
                })
                .then(() => load_mailbox('inbox'));
            });
            emailDetails.appendChild(archiveButton);
        }

        
        const replyButton = document.createElement('button');
        replyButton.innerHTML = "Reply";
        replyButton.className = 'google-button'; 
        replyButton.addEventListener('click', () => reply_email(email));
        emailDetails.appendChild(replyButton);

        document.querySelector('#emails-container').append(emailDetails);
    });
}

function reply_email(email) {
    
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`;

  
    document.querySelector('#compose-body').value = `
Your reply here

-------------------------------------------
On ${email.timestamp.padStart(50)} (${email.sender}) wrote:
${email.body}
-------------------------------------------
`;
}









