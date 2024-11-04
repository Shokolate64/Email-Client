from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Email
from django.contrib.auth.models import User


def index(request):
    return render(request, "mail/inbox.html")

@csrf_exempt
@login_required
def send_email(request):
    if request.method == "POST":
        data = json.loads(request.body)
        sender = request.user

        recipients = data.get("recipients")
        if recipients == "":
            return JsonResponse({"error": "At least one recipient required."}, status=400)

        recipients = recipients.split(",")
        recipient_objs = []
        for email in recipients:
            try:
                user = User.objects.get(email=email.strip())
                recipient_objs.append(user)
            except User.DoesNotExist:
                return JsonResponse({"error": f"User with email {email} does not exist."}, status=400)

        email = Email(
            sender=sender,
            subject=data.get("subject", ""),
            body=data.get("body", "")
        )
        email.save()
        email.recipients.set(recipient_objs)
        email.save()

        return JsonResponse({"message": "Email sent successfully."}, status=201)
    
    return JsonResponse({"error": "POST request required."}, status=400)


def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('index')
    else:
        form = UserCreationForm()
    return render(request, 'mail/register.html', {'form': form})




@login_required
def get_mailbox(request, mailbox):
    if mailbox == 'inbox':
        emails = Email.objects.filter(recipients=request.user, archived=False).order_by('-timestamp')
    elif mailbox == 'sent':
        emails = Email.objects.filter(sender=request.user).order_by('-timestamp')
    elif mailbox == 'archive':
        emails = Email.objects.filter(recipients=request.user, archived=True).order_by('-timestamp')
    else:
        return JsonResponse({"error": "Invalid mailbox."}, status=400)

    return JsonResponse([email.serialize() for email in emails], safe=False)



@csrf_exempt
@login_required
def get_email(request, email_id):
    try:
        email = Email.objects.get(id=email_id)

        if request.user != email.sender and request.user not in email.recipients.all():
            return JsonResponse({"error": "Access denied."}, status=403)

        if request.method == "GET":
            return JsonResponse(email.serialize())
        elif request.method == "PUT":
            data = json.loads(request.body)
            if 'archived' in data:
                email.archived = data['archived']
            if 'read' in data:
                email.read = data['read']
            email.save()
            return JsonResponse({"message": "Email updated successfully."}, status=200)
        else:
            return JsonResponse({"error": "GET or PUT request required."}, status=400)

    except Email.DoesNotExist:
        return JsonResponse({"error": "Email not found."}, status=404)
