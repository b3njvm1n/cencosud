📋 TicketZone - Manual de instalación y ejecución

Este documento te guiará paso a paso para clonar, instalar y ejecutar el proyecto TicketZone en tu computador, tanto el backend (Django) como el frontend (React + Vite).
🧩 ¿Qué es TicketZone?

TicketZone es un sistema web de gestión de reclamos y reparaciones técnicas para locales comerciales. Permite a los clientes reportar fallas, a los técnicos registrar informes de reparación, a los vendedores gestionar atenciones y cobros, y a los administradores y supervisores supervisar el flujo completo de tickets.
✅ Requisitos previos

Antes de comenzar, asegúrate de tener instalado en tu sistema:

    Git – para clonar el repositorio → Descargar

    Python – versión 3.10 o superior → Descargar

    Node.js – versión 18 o superior → Descargar

    npm – se instala automáticamente con Node.js

    Un editor de código (opcional, recomendado: VS Code)

📦 Clonar el repositorio

Abre una terminal y ejecuta:
bash

git clone https://github.com/b3njvm1n/ticketzone.git
cd ticketzone

Si el repositorio es privado, asegúrate de tener acceso o usa SSH.
🖥️ 1. Backend (Django)
1.1 Crear y activar entorno virtual
bash

# Crear entorno virtual
python -m venv venv

# Activar en Linux/Mac
source venv/bin/activate

# Activar en Windows
venv\Scripts\activate

1.2 Instalar dependencias
bash

pip install -r requirements.txt

Si por algún motivo no tienes el archivo requirements.txt, instala manualmente:
bash

pip install Django djangorestframework djangorestframework-simplejwt django-cors-headers

1.3 Aplicar migraciones a la base de datos
bash

python manage.py makemigrations
python manage.py migrate

1.4 (Opcional) Crear superusuario para el panel de administración
bash

python manage.py createsuperuser

Sigue las instrucciones (ej. usuario: admin@tienda.cl, contraseña: admin123).
1.5 Cargar datos de prueba (usuarios con roles)

Ejecuta el siguiente comando para crear los usuarios de prueba:
bash

python manage.py shell

Y pega este script:
python

from django.contrib.auth.models import User
from api.models import Perfil

usuarios = [
    {'username': 'tecnico@tienda.cl', 'password': 'tec123', 'rol': 'tecnico'},
    {'username': 'vendedor@tienda.cl', 'password': 'ven123', 'rol': 'vendedor'},
    {'username': 'supervisor@tienda.cl', 'password': 'sup123', 'rol': 'supervisor'},
    {'username': 'admin@tienda.cl', 'password': 'adm123', 'rol': 'administrador'},
    {'username': 'gerente@tienda.cl', 'password': 'ger123', 'rol': 'gerente'},
]

for data in usuarios:
    user, created = User.objects.get_or_create(username=data['username'])
    user.set_password(data['password'])
    user.save()
    perfil, created = Perfil.objects.get_or_create(user=user, defaults={'rol': data['rol']})
    if not created:
        perfil.rol = data['rol']
        perfil.save()
    print(f"✅ Usuario {data['username']} creado con rol {data['rol']}")

Sal del shell con exit().
1.6 Ejecutar el servidor backend
bash

python manage.py runserver

El backend estará disponible en: http://127.0.0.1:8000/
🎨 2. Frontend (React + Vite)

Abre una nueva terminal (mantén el backend corriendo) y navega a la raíz del proyecto.
2.1 Instalar dependencias
bash

npm install

2.2 Configurar variable de entorno (opcional)

Crea un archivo .env en la raíz con el siguiente contenido (si el backend corre en otro puerto, ajusta la URL):
text

VITE_API_URL=http://127.0.0.1:8000/api

2.3 Ejecutar el servidor frontend
bash

npm run dev

El frontend estará disponible en: http://localhost:5173/
🔑 Credenciales de prueba
Rol	Usuario	Contraseña
👑 Administrador	admin@tienda.cl	adm123
📊 Gerente	gerente@tienda.cl	ger123
🛠️ Supervisor	supervisor@tienda.cl	sup123
🧑‍🔧 Técnico	tecnico@tienda.cl	tec123
🛒 Vendedor	vendedor@tienda.cl	ven123
🧪 Probar la API (opcional)

Puedes probar los endpoints directamente en el navegador o con Postman:

    Listar tickets (público): http://127.0.0.1:8000/api/tickets/

    Obtener token JWT: POST a http://127.0.0.1:8000/api/token/ con {"username": "admin@tienda.cl", "password": "adm123"}

si llegas a tener problemas con el backend ejecuta los siguientes comandos en la terminal para poder solucionarlos 

pip install setuptools
pip install --upgrade djangorestframework-simplejwt
pip install --upgrade setuptools
pip uninstall djangorestframework-simplejwt -y
pip install djangorestframework-simplejwt
pip install drf-spectacular

o si no modificando el archivo
/venv/lib/python3.14/site-packages/rest_framework_simplejwt/__init__.py




from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("djangorestframework_simplejwt")
except PackageNotFoundError:
    # package is not installed
    __version__ = None
dejare igual la copia en el repositorio para copiar y pegar
