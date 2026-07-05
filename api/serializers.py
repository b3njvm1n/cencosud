# api/serializers.py
from rest_framework import serializers
from .models import Ticket, AtencionVendedor, InformeTecnico, Material, Perfil, Venta  # <-- Agregado Venta
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    rol = serializers.CharField(source='perfil.rol', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rol']

class PerfilSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Perfil
        fields = ['id', 'user', 'rol']

class TicketSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    informes = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['fecha']

class AtencionVendedorSerializer(serializers.ModelSerializer):
    vendedor = serializers.StringRelatedField(read_only=True)
    ticketRelacionado = serializers.PrimaryKeyRelatedField(queryset=Ticket.objects.all(), required=False, allow_null=True)

    class Meta:
        model = AtencionVendedor
        fields = '__all__'
        read_only_fields = ['vendedor', 'fecha']

class InformeTecnicoSerializer(serializers.ModelSerializer):
    tecnico = serializers.StringRelatedField(read_only=True)
    ticket = serializers.PrimaryKeyRelatedField(queryset=Ticket.objects.all())

    class Meta:
        model = InformeTecnico
        fields = '__all__'
        read_only_fields = ['tecnico', 'fecha']

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'

# ----- NUEVO SERIALIZER PARA VENTAS -----
class VentaSerializer(serializers.ModelSerializer):
    vendedor = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Venta
        fields = '__all__'
        read_only_fields = ['vendedor', 'fecha']

# ----- SERIALIZER PARA REGISTRO DE USUARIOS DESDE ADMIN -----
class UsuarioRegistroSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    rol = serializers.ChoiceField(choices=Perfil.ROLES)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("El usuario ya existe.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
        perfil, created = Perfil.objects.get_or_create(
            user=user,
            defaults={'rol': validated_data['rol']}
        )
        if not created:
            perfil.rol = validated_data['rol']
            perfil.save()
        return user