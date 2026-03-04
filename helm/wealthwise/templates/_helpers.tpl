{{/*
Chart name, truncated to 63 chars.
*/}}
{{- define "wealthwise.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Fully qualified app name, truncated to 63 chars.
*/}}
{{- define "wealthwise.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart label value.
*/}}
{{- define "wealthwise.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to all resources.
*/}}
{{- define "wealthwise.commonLabels" -}}
helm.sh/chart: {{ include "wealthwise.chart" . }}
app.kubernetes.io/part-of: wealthwise
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end }}

{{/* ---- API labels ---- */}}

{{- define "wealthwise.api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "wealthwise.fullname" . }}-api
app.kubernetes.io/component: api
{{- end }}

{{- define "wealthwise.api.labels" -}}
{{ include "wealthwise.commonLabels" . }}
{{ include "wealthwise.api.selectorLabels" . }}
{{- end }}

{{/* ---- Web labels ---- */}}

{{- define "wealthwise.web.selectorLabels" -}}
app.kubernetes.io/name: {{ include "wealthwise.fullname" . }}-web
app.kubernetes.io/component: web
{{- end }}

{{- define "wealthwise.web.labels" -}}
{{ include "wealthwise.commonLabels" . }}
{{ include "wealthwise.web.selectorLabels" . }}
{{- end }}

{{/* ---- MCP labels ---- */}}

{{- define "wealthwise.mcp.selectorLabels" -}}
app.kubernetes.io/name: {{ include "wealthwise.fullname" . }}-mcp
app.kubernetes.io/component: mcp
{{- end }}

{{- define "wealthwise.mcp.labels" -}}
{{ include "wealthwise.commonLabels" . }}
{{ include "wealthwise.mcp.selectorLabels" . }}
{{- end }}

{{/* ---- Agentic AI labels ---- */}}

{{- define "wealthwise.agenticAi.selectorLabels" -}}
app.kubernetes.io/name: {{ include "wealthwise.fullname" . }}-agentic-ai
app.kubernetes.io/component: agentic-ai
{{- end }}

{{- define "wealthwise.agenticAi.labels" -}}
{{ include "wealthwise.commonLabels" . }}
{{ include "wealthwise.agenticAi.selectorLabels" . }}
{{- end }}

{{/* ---- Secret name (supports existingSecret) ---- */}}

{{- define "wealthwise.secretName" -}}
{{- if .Values.existingSecret }}
{{- .Values.existingSecret }}
{{- else }}
{{- include "wealthwise.fullname" . }}-secrets
{{- end }}
{{- end }}

{{/* ---- ConfigMap name (supports existingConfigMap) ---- */}}

{{- define "wealthwise.configMapName" -}}
{{- if .Values.existingConfigMap }}
{{- .Values.existingConfigMap }}
{{- else }}
{{- include "wealthwise.fullname" . }}-config
{{- end }}
{{- end }}

{{/* ---- Namespace ---- */}}

{{- define "wealthwise.namespace" -}}
{{- default .Release.Namespace .Values.namespace.name }}
{{- end }}
