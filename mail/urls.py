from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from django.contrib.auth import logout
from django.shortcuts import redirect

def logout_view(request):
    logout(request)
    return redirect('login')

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', auth_views.LoginView.as_view(template_name='mail/login.html'), name='login'),
    path('logout', logout_view, name='logout'),
    path('logout', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
    path('register', views.register, name='register'),
    path('emails/<int:email_id>', views.get_email, name='get_email'),
    path('emails', views.send_email, name='send_email'),
    path('emails/<str:mailbox>', views.get_mailbox, name='get_mailbox'),
]

