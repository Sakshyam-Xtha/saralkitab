from django.urls import path
from . import views

urlpatterns = [
    path("",views.index),
    path("health/", views.health),
    path("register/", views.Register),
    path("login/", views.Login),
]
