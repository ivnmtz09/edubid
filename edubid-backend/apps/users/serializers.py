from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Profile
from django.contrib.auth.password_validation import validate_password


class InstitutionMiniSerializer(serializers.Serializer):
    """Resumen de institución para anidar en el perfil del usuario."""
    id = serializers.IntegerField(read_only=True)
    nombre = serializers.CharField(read_only=True)
    color_primario = serializers.CharField(read_only=True)
    color_secundario = serializers.CharField(read_only=True)
    logo = serializers.ImageField(read_only=True)


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'role', 'password', 'password_confirm']

    def validate_role(self, value):
        """Solo permitir estudiante o docente en el registro público"""
        allowed_roles = ['estudiante', 'docente']
        if value not in allowed_roles:
            raise serializers.ValidationError(
                f"Rol no válido. Los roles permitidos son: {', '.join(allowed_roles)}"
            )
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        if not validated_data.get('username'):
            validated_data['username'] = validated_data['email'].split('@')[0]
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data.get('email'), password=data.get('password'))
        if user and user.is_active:
            data['user'] = user
            return data
        raise serializers.ValidationError("Credenciales inválidas")


class ProfileSerializer(serializers.ModelSerializer):
    institucion = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['bio', 'telefono', 'direccion', 'fecha_nacimiento', 'institucion']

    def get_institucion(self, obj):
        """Retorna los datos de la institución desde la FK del User."""
        user = obj.user
        if user and user.institucion_id:
            return InstitutionMiniSerializer(user.institucion).data
        return None


class UserProfileSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'avatar', 'date_joined', 'profile']
        read_only_fields = ['id', 'date_joined']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Las nuevas contraseñas no coinciden.")
        return data

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value
    