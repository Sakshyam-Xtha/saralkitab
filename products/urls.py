from django.urls import path
from . import views

urlpatterns = [
    path("",views.index),
    path("transactions/",views.transaction),
    path("add/",views.add_product),
]
