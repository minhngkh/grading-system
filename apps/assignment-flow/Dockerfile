# AssignmentFlow Dockerfile
# Multi-stage build for .NET 9 application

FROM mcr.microsoft.com/dotnet/runtime-deps:9.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Create a non-root user
RUN adduser --disabled-password --gecos '' appuser

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy global and solution files first
COPY ["Directory.Packages.props", "./"]
COPY ["GradingSystem.sln", "./"]

# Copy all project files for dependency resolution
COPY ["apps/assignment-flow/AssignmentFlow.Application/AssignmentFlow.Application.csproj", "apps/assignment-flow/AssignmentFlow.Application/"]
COPY ["apps/assignment-flow/AssignmentFlow.IntegrationEvents/AssignmentFlow.IntegrationEvents.csproj", "apps/assignment-flow/AssignmentFlow.IntegrationEvents/"]
COPY ["libs/shared-dotnet/Shared.ValueObjects/Shared.ValueObjects.csproj", "libs/shared-dotnet/Shared.ValueObjects/"]
COPY ["tools/service-defaults/GradingSystem.ServiceDefaults.csproj", "tools/service-defaults/"]

# Clear any existing packages and do a clean restore
RUN dotnet nuget locals all --clear
RUN dotnet restore "apps/assignment-flow/AssignmentFlow.Application/AssignmentFlow.Application.csproj" --force --no-cache --verbosity normal

# Copy all source code
COPY . .
WORKDIR "/src/apps/assignment-flow/AssignmentFlow.Application"

# Build the application with ReadyToRun compilation
RUN dotnet build "AssignmentFlow.Application.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AssignmentFlow.Application.csproj" -c Release -o /app/publish \
    -r linux-x64 \
    --self-contained \
    -p:PublishReadyToRun=true \
    -p:PublishSingleFile=false \
    -p:PublishTrimmed=false

# Final stage
FROM base AS final
WORKDIR /app

# Copy published app
COPY --from=publish /app/publish .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health/live || exit 1

ENTRYPOINT ["dotnet", "AssignmentFlow.Application.dll"]
