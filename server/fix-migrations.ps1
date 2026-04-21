$dir = "d:\opensource_project\opencode-main\opencode-main\tech plugins\multica-main\openzoo\server\migrations"
Get-ChildItem $dir -Filter "*.up.sql" | ForEach-Object {
    $c = Get-Content $_.FullName -Raw
    $orig = $c
    $c = $c -replace 'userss\b', 'users'
    $c = $c -replace 'workspacess\b', 'workspaces'
    $c = $c -replace 'commentss\b', 'comments'
    $c = $c -replace 'projectss\b', 'projects'
    $c = $c -replace 'agentss\b', 'agents'
    $c = $c -replace 'runtimess\b', 'runtimes'
    $c = $c -replace 'taskss\b', 'tasks'
    $c = $c -replace 'memberss\b', 'members'
    $c = $c -replace 'labelss\b', 'labels'
    $c = $c -replace 'skillss\b', 'skills'
    $c = $c -replace 'chat_sessionss\b', 'chat_sessions'
    $c = $c -replace 'chat_messagess\b', 'chat_messages'
    $c = $c -replace 'inbox_itemss\b', 'inbox_items'
    $c = $c -replace 'issue_subscriberss\b', 'issue_subscribers'
    $c = $c -replace 'daemon_tokenss\b', 'daemon_tokens'
    $c = $c -replace 'issue_reactionss\b', 'issue_reactions'
    $c = $c -replace 'runtime_usages\b', 'runtime_usage'
    $c = $c -replace "CHECK \(user_type IN \('', ''\)\)", "CHECK (user_type IN ('user', 'agent'))"
    $c = $c -replace 'REFERENCES \(id\)', 'REFERENCES issues(id)'
    if ($c -ne $orig) {
        Set-Content $_.FullName $c -NoNewline
        Write-Output "Fixed: $($_.Name)"
    }
}
Write-Output "Done"
