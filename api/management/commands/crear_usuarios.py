from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Perfil

class Command(BaseCommand):
    help = 'Crea usuarios de prueba con roles específicos'

    def handle(self, *args, **kwargs):
        usuarios_data = [
            {'username': 'tecnico@tienda.cl', 'password': 'tec123', 'rol': 'tecnico'},
            {'username': 'vendedor@tienda.cl', 'password': 'ven123', 'rol': 'vendedor'},
            {'username': 'supervisor@tienda.cl', 'password': 'sup123', 'rol': 'supervisor'},
            {'username': 'admin@tienda.cl', 'password': 'adm123', 'rol': 'administrador'},
            {'username': 'gerente@tienda.cl', 'password': 'ger123', 'rol': 'gerente'},
        ]

        for data in usuarios_data:
            user, created = User.objects.get_or_create(username=data['username'])
            user.set_password(data['password'])
            user.save()

            perfil, created = Perfil.objects.get_or_create(user=user, defaults={'rol': data['rol']})
            if not created:
                perfil.rol = data['rol']
                perfil.save()

            self.stdout.write(self.style.SUCCESS(f"Usuario {data['username']} con rol {data['rol']} listo."))