from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Snowflake / CoCo CLI Configuration
    SNOWFLAKE_ACCOUNT: str = "placeholder_account"
    SNOWFLAKE_USER: str = "placeholder_user"
    SNOWFLAKE_PASSWORD: str = "placeholder_password"
    SNOWFLAKE_DATABASE: str = "SENTINEL_AI_DB"
    SNOWFLAKE_SCHEMA: str = "PUBLIC"
    SNOWFLAKE_WAREHOUSE: str = "COMPUTE_WH"

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

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
