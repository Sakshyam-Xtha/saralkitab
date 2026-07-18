from django.urls import path
from . import views

urlpatterns = [
    path("",views.index),
    path("transactions/",views.transaction),
    path("update/<int:id>/",views.update),
]
