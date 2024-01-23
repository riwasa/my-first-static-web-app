const fetch = require('node-fetch').default;

// add role names to this object to map them to group ids in your AAD tenant
const roleGroupMappings = {
    'admin': 'b5491cf1-cc6f-4fb1-a898-5b95a3c2f921',
    'reader': '78dbaa8f-a6b4-425a-a15f-1bd85ce047c4'
};

module.exports = async function (context, req) {
    context.log('GetRoles called');
    const user = req.body || {};
    const roles = [];

    context.log(`user: ${JSON.stringify(user)}`);
    
    for (const [role, groupId] of Object.entries(roleGroupMappings)) {
        if (await isUserInGroup(groupId, user.accessToken, context, user)) {
            roles.push(role);
        }
    }

    context.log(roles.toString());

    context.res.json({
        roles
    });
}

async function isUserInGroup(groupId, bearerToken, context, user) {
    context.log(`checking user in group ${groupId}`)

    //GET https://graph.microsoft.com/v1.0/users/6e7b768e-07e2-4810-8459-485f84f8f204/memberOf


    //const url = new URL('https://graph.microsoft.com/v1.0/me/memberOf');
    //url.searchParams.append('$filter', `id eq '${groupId}'`);
    const url = new URL(`https://graph.microsoft.com/v1.0/users/${user.userId}/memberOf`)
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${bearerToken}`
        },
    });

    context.log(`response: ${JSON.stringify(response)}`)
    context.log(`url: ${url}`);

    context.log(`response status: ${response.status}`);

    if (response.status !== 200) {
        return false;
    }

    const graphResponse = await response.json();

    context.log(`graph response: ${JSON.stringify(graphResponse)}`);

    const matchingGroups = graphResponse.value.filter(group => group.id === groupId);
    return matchingGroups.length > 0;
}