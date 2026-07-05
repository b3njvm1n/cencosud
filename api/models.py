# api/models.py
from django.db import models
from django.contrib.auth.models import User

class Perfil(models.Model):
    ROLES = (
    ('administrador', 'Administrador'),   # Cambio de 'admin' a 'administrador'
    ('supervisor', 'Supervisor'),
    ('tecnico', 'Técnico'),
    ('vendedor', 'Vendedor'),
    ('gerente', 'Gerente'),
    ('cliente', 'Cliente'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    rol = models.CharField(max_length=20, choices=ROLES, default='cliente')

    def __str__(self):
        return f"{self.user.username} - {self.rol}"

class Ticket(models.Model):
    ESTADO_CHOICES = (
        ('abierto', 'Abierto'),
        ('progreso', 'En progreso'),
        ('resuelto', 'Resuelto'),
        ('cerrado', 'Cerrado'),
    )
    PRIORIDAD_CHOICES = (
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
    )
    ESTADO_VISUAL_CHOICES = (
        ('baja', 'Prioridad baja'),
        ('media', 'Prioridad media'),
        ('urgente', 'Urgente'),
        ('revision', 'En revisión'),
        ('resuelto', 'Resuelto'),
    )

    id = models.CharField(max_length=50, primary_key=True)
    fecha = models.DateTimeField(auto_now_add=True)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    nacionalidad = models.CharField(max_length=50)
    sexo = models.CharField(max_length=20)
    documento = models.CharField(max_length=20)
    boleta = models.CharField(max_length=30)
    categoria = models.CharField(max_length=50)
    categoriaTexto = models.CharField(max_length=100)
    producto = models.CharField(max_length=100)
    explicacion = models.TextField()
    evidenciaNombre = models.CharField(max_length=255, null=True, blank=True)
    evidenciaTipo = models.CharField(max_length=50, null=True, blank=True)
    evidenciaBase64 = models.TextField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='progreso')
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='media')
    estado_visual = models.CharField(max_length=20, choices=ESTADO_VISUAL_CHOICES, default='revision')
    comentarioSupervisor = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.id

class AtencionVendedor(models.Model):
    fecha = models.DateTimeField(auto_now_add=True)
    vendedor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='atenciones')
    nombreCliente = models.CharField(max_length=100)
    apellidoCliente = models.CharField(max_length=100)
    ticketRelacionado = models.ForeignKey(Ticket, on_delete=models.SET_NULL, null=True, blank=True)
    notas = models.TextField()
    montoCobro = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    detalleCobro = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Atención de {self.vendedor.username} - {self.fecha}"

class InformeTecnico(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='informes')
    tecnico = models.ForeignKey(User, on_delete=models.CASCADE)
    fecha = models.DateTimeField(auto_now_add=True)
    nombreAsistido = models.CharField(max_length=100)
    apellidoAsistido = models.CharField(max_length=100)
    explicacion = models.TextField()
    correccion = models.CharField(max_length=20, choices=[('si','Sí'), ('parcial','Parcial'), ('no','No')])

    def __str__(self):
        return f"Informe para {self.ticket.id} - {self.tecnico.username}"

class Material(models.Model):
    nombre = models.CharField(max_length=100)
    cantidad = models.IntegerField()
    costoUnitario = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre

class Venta(models.Model):
    """
    Modelo para registrar ventas de productos realizadas por vendedores.
    Se utiliza en el dashboard de Admin y Gerente para calcular ingresos.
    """
    boleta = models.CharField(max_length=30, unique=True)  # número único de boleta
    fecha = models.DateTimeField(auto_now_add=True)
    vendedor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ventas')
    nombreCliente = models.CharField(max_length=100)
    apellidoCliente = models.CharField(max_length=100)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    productos = models.JSONField()  # lista de {nombre, cantidad, precio}
    estado = models.CharField(max_length=20, default='activa', choices=[('activa', 'Activa'), ('anulada', 'Anulada')])

    def __str__(self):
        return f"Boleta {self.boleta} - {self.vendedor.username} - ${self.total}"