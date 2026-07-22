#!/usr/bin/env bash
# Sentinel AI - Automated Snowflake Setup Script using Snowflake CLI (`snow`)
# Executes setup SQL scripts in sequential order (1 -> 5)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================================"
echo "🛡️  Sentinel AI - Automated Snowflake Setup (Snowflake CLI)"
echo "============================================================"

# Check if Snowflake CLI ('snow') is installed
if ! command -v snow &> /dev/null; then
    echo "❌ Snowflake CLI ('snow') is not installed or not in PATH."
    echo "   Install via: uv tool install snowflake-cli"
    exit 1
fi

SQL_FILES=(
    "setup_1_schema.sql"
    "setup_2_seed.sql"
    "setup_3_cortex_search.sql"
    "setup_4_semantic_view.sql"
    # "setup_5_cortex_agent.sql"  # Optional: Uncomment if deploying autonomous Cortex Agent object
)

echo "🚀 Executing Snowflake SQL setup scripts sequentially using Snowflake CLI ('snow sql')..."

for sql_file in "${SQL_FILES[@]}"; do
    full_path="$SCRIPT_DIR/$sql_file"
    if [ -f "$full_path" ]; then
        echo "------------------------------------------------------------"
        echo "▶️ Executing $sql_file ..."
        snow sql -f "$full_path"
        echo "✅ Finished $sql_file"
    else
        echo "❌ Error: $full_path not found!"
        exit 1
    fi
done

echo "============================================================"
echo "🎉 Snowflake Database & Cortex Agent Setup Complete!"
echo "============================================================"
