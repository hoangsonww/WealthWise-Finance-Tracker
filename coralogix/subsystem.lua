function set_subsystem(tag, timestamp, record)
    local container = record["container_name"] or ""
    if string.find(container, "api") then
        record["cx.subsystem.name"] = "api"
    elseif string.find(container, "web") then
        record["cx.subsystem.name"] = "web"
    elseif string.find(container, "mcp") then
        record["cx.subsystem.name"] = "mcp"
    elseif string.find(container, "agentic") then
        record["cx.subsystem.name"] = "agentic-ai"
    elseif string.find(container, "nginx") then
        record["cx.subsystem.name"] = "nginx"
    elseif string.find(container, "mongo") then
        record["cx.subsystem.name"] = "mongodb"
    elseif string.find(container, "otel") then
        record["cx.subsystem.name"] = "otel-collector"
    else
        record["cx.subsystem.name"] = "unknown"
    end
    return 1, timestamp, record
end
