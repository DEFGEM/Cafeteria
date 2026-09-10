from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Numeric,
    ForeignKey
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Pedido(Base):

    __tablename__ = "pedido"

    id_pedido = Column(
        Integer,
        primary_key=True,
        index=True
    )

    fecha = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    estado = Column(
        String(30),
        default="Pendiente",
    )

    total = Column(
        Numeric(10, 2),
        default=0,
    )

    id_mesa = Column(
        Integer,
        ForeignKey("mesa.id_mesa"),
        nullable=False
    )

    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
        nullable=False
    )

    mesa = relationship("Mesa")
    usuario = relationship("Usuario")

    operacion = relationship(
        "PedidoOperacion",
        back_populates="pedido",
        uselist=False,
        cascade="all, delete-orphan",
        single_parent=True,
    )

    detalles = relationship(
        "DetallePedido",
        back_populates="pedido",
        cascade="all, delete-orphan"
    )

    def _asegurar_operacion(self):
        if self.operacion is None:
            from app.models.pedido_operacion import PedidoOperacion

            self.operacion = PedidoOperacion()
        return self.operacion

    @property
    def observaciones(self):
        return self.operacion.observaciones if self.operacion else None

    @observaciones.setter
    def observaciones(self, valor):
        self._asegurar_operacion().observaciones = valor

    @property
    def creado_en(self):
        if self.operacion and self.operacion.creado_en is not None:
            return self.operacion.creado_en
        return self.fecha

    @creado_en.setter
    def creado_en(self, valor):
        self._asegurar_operacion().creado_en = valor

    @property
    def preparacion_iniciada_en(self):
        return self.operacion.preparacion_iniciada_en if self.operacion else None

    @preparacion_iniciada_en.setter
    def preparacion_iniciada_en(self, valor):
        self._asegurar_operacion().preparacion_iniciada_en = valor

    @property
    def listo_en(self):
        return self.operacion.listo_en if self.operacion else None

    @listo_en.setter
    def listo_en(self, valor):
        self._asegurar_operacion().listo_en = valor

    @property
    def demora_reportada_en(self):
        return self.operacion.demora_reportada_en if self.operacion else None

    @demora_reportada_en.setter
    def demora_reportada_en(self, valor):
        self._asegurar_operacion().demora_reportada_en = valor

    @property
    def nota_cocina(self):
        return self.operacion.nota_cocina if self.operacion else None

    @nota_cocina.setter
    def nota_cocina(self, valor):
        self._asegurar_operacion().nota_cocina = valor

    @property
    def pagado_en(self):
        return self.operacion.pagado_en if self.operacion else None

    @pagado_en.setter
    def pagado_en(self, valor):
        self._asegurar_operacion().pagado_en = valor

    @property
    def metodo_pago(self):
        return self.operacion.metodo_pago if self.operacion else None

    @metodo_pago.setter
    def metodo_pago(self, valor):
        self._asegurar_operacion().metodo_pago = valor

    @property
    def monto_recibido(self):
        return self.operacion.monto_recibido if self.operacion else None

    @monto_recibido.setter
    def monto_recibido(self, valor):
        self._asegurar_operacion().monto_recibido = valor

    @property
    def cambio(self):
        return self.operacion.cambio if self.operacion else None

    @cambio.setter
    def cambio(self, valor):
        self._asegurar_operacion().cambio = valor

    @property
    def referencia_pago(self):
        return self.operacion.referencia_pago if self.operacion else None

    @referencia_pago.setter
    def referencia_pago(self, valor):
        self._asegurar_operacion().referencia_pago = valor

    @property
    def id_usuario_caja(self):
        return self.operacion.id_usuario_caja if self.operacion else None

    @id_usuario_caja.setter
    def id_usuario_caja(self, valor):
        self._asegurar_operacion().id_usuario_caja = valor

    @property
    def usuario_caja(self):
        return self.operacion.usuario_caja if self.operacion else None

    @usuario_caja.setter
    def usuario_caja(self, valor):
        self._asegurar_operacion().usuario_caja = valor
