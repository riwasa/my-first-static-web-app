const fetch = require('node-fetch').default;

// add role names to this object to map them to group ids in your AAD tenant
const roleGroupMappings = {
    'admin': 'eea4556c-6874-48fa-8ca1-fbda6c0763b6',
    'reader': 'abc23d63-ee6a-4aec-9d50-1eec10e0f602'
};

module.exports = async function (context, req) {
    context.log('GetRoles called');
    const user = req.body || {};
    const roles = [];

    context.log(`user: ${JSON.stringify(user)}`);
    
    for (const [role, groupId] of Object.entries(roleGroupMappings)) {
        if (await isUserInGroup(groupId, user.accessToken, context)) {
            roles.push(role);
        }
    }

    context.log(roles.toString());

    context.res.json({
        roles
    });
}

async function isUserInGroup(groupId, bearerToken, context) {
    context.log(`checking user in group ${groupId}`)
    const url = new URL('https://graph.microsoft.com/v1.0/me/memberOf');
    url.searchParams.append('$filter', `id eq '${groupId}'`);
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${bearerToken}`
        },
    });

    context.log(`response status: ${response.status}`);

    if (response.status !== 200) {
        return false;
    }

    const graphResponse = await response.json();

    context.log(`graph response: ${JSON.stringify(graphResponse)}`);

    const matchingGroups = graphResponse.value.filter(group => group.id === groupId);
    return matchingGroups.length > 0;
}