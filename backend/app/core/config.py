from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application / Server Configuration
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # Jurisdiction & Region Configuration
    DEFAULT_JURISDICTION_CITY: str = "Zamboanga City"
    DEFAULT_JURISDICTION_REGION: str = "Zamboanga Peninsula"
    DEFAULT_MAP_LATITUDE: float = 6.9214
    DEFAULT_MAP_LONGITUDE: float = 122.0790
    DEFAULT_MAP_ZOOM: float = 12.5

    # Snowflake / CoCo CLI Configuration
    SNOWFLAKE_ACCOUNT: str = "placeholder_account"
    SNOWFLAKE_USER: str = "placeholder_user"
    SNOWFLAKE_PASSWORD: str = "placeholder_password"
    SNOWFLAKE_DATABASE: str = "SENTINEL_AI_DB"
    SNOWFLAKE_SCHEMA: str = "PUBLIC"
    SNOWFLAKE_WAREHOUSE: str = "COMPUTE_WH"
    SNOWFLAKE_ROLE: str = "ACCOUNTADMIN"
    SNOWFLAKE_CORTEX_MODEL: str = "llama3-8b"

    # Twilio Configuration
    TWILIO_ACCOUNT_SID: str = "placeholder_twilio_sid"
    TWILIO_AUTH_TOKEN: str = "placeholder_twilio_token"
    TWILIO_PHONE_NUMBER: str = "+1234567890"

    # SMTP Configuration
    SMTP_SERVER: str = "smtp.placeholder.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "placeholder_smtp_user"
    SMTP_PASSWORD: str = "placeholder_smtp_password"
    SMTP_FROM_EMAIL: str = "alerts@sentinelai.demo"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
