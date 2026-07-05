# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TicketViewSet, AtencionVendedorViewSet,
    InformeTecnicoViewSet, MaterialViewSet,
    UserViewSet, PerfilViewSet,
    RegistroUsuarioView,
    AdminDashboardView,
    VentaViewSet  # <-- NUEVA IMPORTACIÓN
)

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'atenciones', AtencionVendedorViewSet, basename='atencion')
router.register(r'informes', InformeTecnicoViewSet, basename='informe')
router.register(r'materiales', MaterialViewSet, basename='material')
router.register(r'usuarios', UserViewSet, basename='usuario')
router.register(r'perfiles', PerfilViewSet, basename='perfil')
router.register(r'ventas', VentaViewSet, basename='venta')  # <-- NUEVO REGISTRO

urlpatterns = [
    path('', include(router.urls)),
    path('registro-usuario/', RegistroUsuarioView.as_view(), name='registro-usuario'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
]