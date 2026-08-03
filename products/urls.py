from django.urls import path
from . import views

urlpatterns = [
    path("",views.index),
    path("<int:id>",views.index),
    path("add/",views.add_product),
    path("delete/<int:id>/",views.delete_product),
    path("update/<int:id>/",views.update),
    path("restock/<int:id>/",views.restock),
    path("transactions/",views.transaction),
    path("transactions/<int:id>/",views.transaction),
    path("transactions/add/",views.make_transaction)
]
