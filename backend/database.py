from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./validation.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=True)
    phone_hash = Column(String, nullable=True)
    email_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    addresses = relationship("Address", back_populates="user")


class Address(Base):
    __tablename__ = "addresses"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    house_no = Column(String)
    street = Column(String)
    locality = Column(String)
    city = Column(String)
    district = Column(String)
    state = Column(String)
    pin = Column(String)
    digipin = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="addresses")
    validation_requests = relationship("ValidationRequest", back_populates="address")


class ValidationRequest(Base):
    __tablename__ = "validation_requests"
    
    id = Column(String, primary_key=True, index=True)
    address_id = Column(String, ForeignKey("addresses.id"))
    requester_id = Column(String, ForeignKey("users.id"))
    consent_json = Column(JSON)
    status = Column(String, default="queued")  # queued, processing, done, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    address = relationship("Address", back_populates="validation_requests")
    evidence_signals = relationship("EvidenceSignal", back_populates="validation_request")
    result = relationship("ValidationResult", back_populates="validation_request", uselist=False)


class EvidenceSignal(Base):
    __tablename__ = "evidence_signals"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    validation_request_id = Column(String, ForeignKey("validation_requests.id"))
    type = Column(String)  # geo, temporal, iot, doc, crowd, history
    score = Column(Float)
    details_json = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    validation_request = relationship("ValidationRequest", back_populates="evidence_signals")


class ValidationResult(Base):
    __tablename__ = "validation_results"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    validation_request_id = Column(String, ForeignKey("validation_requests.id"), unique=True)
    acs = Column(Float)  # Address Confidence Score 0-100
    vl = Column(String)  # VL0, VL1, VL2, VL3
    reason_codes = Column(JSON)
    suggestions = Column(JSON)
    token_id = Column(Integer, ForeignKey("tokens.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    validation_request = relationship("ValidationRequest", back_populates="result")
    token = relationship("Token", back_populates="validation_result")


class Token(Base):
    __tablename__ = "tokens"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    validation_request_id = Column(String, ForeignKey("validation_requests.id"))
    jwt = Column(String)
    issued_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    revoked = Column(Boolean, default=False)
    
    validation_result = relationship("ValidationResult", back_populates="token")


class MockDigipinGrid(Base):
    __tablename__ = "mock_digipin_grid"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    digipin = Column(String, unique=True, index=True)
    lat = Column(Float)
    long = Column(Float)
    locality = Column(String)
    city = Column(String)
    district = Column(String)
    state = Column(String)
    pin = Column(String)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String)
    user_id = Column(String, nullable=True)
    details_json = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize the database and create all tables"""
    Base.metadata.create_all(bind=engine)
