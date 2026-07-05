from django.shortcuts import render
from rest_framework import viewsets, permissions, filters
from rest_framework.views import APIView
from rest_framework import status
from .models import Ticket, AtencionVendedor, InformeTecnico, Material, Perfil, Venta
from .serializers import (TicketSerializer, AtencionVendedorSerializer,
                          InformeTecnicoSerializer, MaterialSerializer,
                          PerfilSerializer, UserSerializer,
                          UsuarioRegistroSerializer,
                          VentaSerializer)  # <-- AGREGADO
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.db import IntegrityError
from datetime import datetime
from django.db.models import Sum, F
from django.utils import timezone


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class PerfilViewSet(viewsets.ModelViewSet):
    queryset = Perfil.objects.all()
    serializer_class = PerfilSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        perfil, created = Perfil.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(perfil)
        return Response(serializer.data)


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['id', 'nombres', 'apellidos', 'producto', 'categoria']
    ordering_fields = ['fecha', 'prioridad', 'estado']

    def get_permissions(self):
        if self.action in ['create', 'list']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError as e:
            print(f"IntegrityError al crear ticket: {e}")
            return Response(
                {"error": "El ID del ticket ya existe. Por favor, intenta nuevamente."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"Error inesperado al crear ticket: {e}")
            return Response(
                {"error": "Ocurrió un error al crear el ticket."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='estadisticas')
    def estadisticas(self, request):
        tickets = self.get_queryset()
        total = tickets.count()
        resueltos = tickets.filter(estado='resuelto').count()
        urgentes = tickets.filter(prioridad='alta').count()
        return Response({
            'total': total,
            'resueltos': resueltos,
            'urgentes': urgentes,
        })


class AtencionVendedorViewSet(viewsets.ModelViewSet):
    queryset = AtencionVendedor.objects.all()
    serializer_class = AtencionVendedorSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(vendedor=self.request.user)


class InformeTecnicoViewSet(viewsets.ModelViewSet):
    queryset = InformeTecnico.objects.all()
    serializer_class = InformeTecnicoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(tecnico=self.request.user)


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]


# ===== NUEVO VIEWSET PARA VENTAS =====
class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all()
    serializer_class = VentaSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Asigna automáticamente el vendedor autenticado."""
        serializer.save(vendedor=self.request.user)


# ===== VISTA PARA REGISTRO DE USUARIOS DESDE ADMIN =====
class RegistroUsuarioView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            perfil_admin = request.user.perfil
            if perfil_admin.rol != 'administrador':
                return Response(
                    {"error": "No tienes permisos para crear usuarios."},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Perfil.DoesNotExist:
            return Response(
                {"error": "Tu perfil no está configurado."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = UsuarioRegistroSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(
                    {"message": "Usuario creado exitosamente."},
                    status=status.HTTP_201_CREATED
                )
            except IntegrityError as e:
                print(f"IntegrityError: {e}")
                return Response(
                    {"error": "El usuario ya existe o el perfil está duplicado."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                print(f"Error inesperado: {e}")
                return Response(
                    {"error": "Ocurrió un error inesperado al crear el usuario."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ===== VISTA PARA DASHBOARD DEL ADMIN =====
class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            perfil = request.user.perfil
            if perfil.rol != 'administrador':
                return Response(
                    {"error": "No tienes permisos para acceder al dashboard."},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Perfil.DoesNotExist:
            return Response(
                {"error": "Perfil no encontrado."},
                status=status.HTTP_403_FORBIDDEN
            )

        hoy = timezone.now().date()

        tickets = Ticket.objects.all()
        abiertos = tickets.filter(estado__in=['abierto', 'progreso']).count()

        atenciones = AtencionVendedor.objects.all()
        reparaciones_hoy = atenciones.filter(fecha__date=hoy)
        ingresos_cobros = reparaciones_hoy.aggregate(total=Sum('montoCobro'))['total'] or 0

        ventas = Venta.objects.all()
        ventas_hoy = ventas.filter(fecha__date=hoy, estado='activa')
        ingresos_ventas = ventas_hoy.aggregate(total=Sum('total'))['total'] or 0

        materiales = Material.objects.all()
        gasto_hoy = materiales.filter(fecha__date=hoy).aggregate(
            total=Sum(F('cantidad') * F('costoUnitario'))
        )['total'] or 0
        total_materiales = materiales.count()

        ultimas_reparaciones = atenciones.order_by('-fecha')[:5]
        ultimas_reparaciones_data = [
            {
                'id': r.id,
                'fecha': r.fecha,
                'vendedor': r.vendedor.username if r.vendedor else 'Sin vendedor',
                'nombreCliente': r.nombreCliente,
                'apellidoCliente': r.apellidoCliente,
                'notas': r.notas,
                'montoCobro': r.montoCobro,
                'detalleCobro': r.detalleCobro,
            }
            for r in ultimas_reparaciones
        ]

        return Response({
            'reparacionesHoy': reparaciones_hoy.count(),
            'ingresosTotales': ingresos_cobros + ingresos_ventas,
            'abiertos': abiertos,
            'gastoHoy': gasto_hoy,
            'totalMateriales': total_materiales,
            'ultimasReparaciones': ultimas_reparaciones_data,
        })