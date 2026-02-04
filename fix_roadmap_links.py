import sys

with open('server-v2.js', 'r') as f:
    content = f.read()

# Update validateAndCleanResources
old_clean_res = """function validateAndCleanResources(resources) {
    if (!Array.isArray(resources)) return [];

    return resources
        .filter(res => {
            // Keep resource if it has at least one valid field
            return res && (res.name || res.channel || res.title || res.url);
        })
        .map(res => {
            // Ensure resource has a name
            const name = res.name || res.channel || res.title || 'Resource';
            const type = res.type || 'Resource';
            const url = res.url || '#';
            const description = res.why || res.description || res.recommended || '';

            return {
                type,
                name,
                url,
                description
            };
        });
}"""

new_clean_res = """function validateAndCleanResources(resources) {
    if (!Array.isArray(resources)) return [];

    // Flatten known resources for lookup
    const known = [];
    if (typeof RESOURCES !== 'undefined') {
        Object.values(RESOURCES).forEach(cat => {
            if (Array.isArray(cat)) known.push(...cat);
            else Object.values(cat).forEach(sub => {
                if (Array.isArray(sub)) known.push(...sub);
            });
        });
    }

    return resources
        .filter(res => res && (res.name || res.url))
        .map(res => {
            let name = res.name || res.title || res.channel || 'Resource';
            let url = res.url || '#';

            // Try to fix invalid/hallucinated links
            if (url === '#' || !url.startsWith('http')) {
                const match = known.find(k => k.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(k.name.toLowerCase()));
                if (match) {
                    url = match.url;
                    name = match.name;
                } else if (url === '#') {
                    url = `https://www.google.com/search?q=${encodeURIComponent(name + ' cybersecurity resource')}`;
                }
            }

            return {
                type: res.type || 'Resource',
                name,
                url,
                description: res.description || res.why || res.recommended || ''
            };
        });
}"""

# Update validateRoadmapData
old_val_road = """function validateRoadmapData(roadmapObj) {
    if (!roadmapObj || typeof roadmapObj !== 'object') {
        return roadmapObj;
    }

    // Clean phases if they exist
    if (Array.isArray(roadmapObj.phases)) {
        roadmapObj.phases = roadmapObj.phases.map(phase => {
            if (phase.resources) {
                phase.resources = validateAndCleanResources(phase.resources);
            }
            return phase;
        });
    }

    return roadmapObj;
}"""

new_val_road = """function validateRoadmapData(roadmapObj) {
    if (!roadmapObj || typeof roadmapObj !== 'object') {
        return roadmapObj;
    }

    // Check both 'roadmap' and 'phases' keys
    const phases = roadmapObj.roadmap || roadmapObj.phases;

    if (Array.isArray(phases)) {
        const cleanedPhases = phases.map(phase => {
            if (phase.resources) {
                phase.resources = validateAndCleanResources(phase.resources);
            }
            if (phase.mandatory_labs) {
                phase.mandatory_labs = validateAndCleanResources(phase.mandatory_labs);
            }
            return phase;
        });

        if (roadmapObj.roadmap) roadmapObj.roadmap = cleanedPhases;
        if (roadmapObj.phases) roadmapObj.phases = cleanedPhases;
    }

    return roadmapObj;
}"""

# Update prompt grounding
old_ground = "- Use the following RESOURCES for verified links: ${JSON.stringify(resources)}"
new_ground = "- Use the following RESOURCES for verified links. PRIORITIZE these URLs over any you might hallucinate: ${JSON.stringify(resources)}"

content = content.replace(old_clean_res, new_clean_res)
content = content.replace(old_val_road, new_val_road)
content = content.replace(old_ground, new_ground)

with open('server-v2.js', 'w') as f:
    f.write(content)
