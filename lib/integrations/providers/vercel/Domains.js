class VercelDomains {
  constructor(provider) {
    this.provider = provider;
  }

  async list(projectId) {
    return {
      success: true,
      data: [
        { name: 'example.com', apx: { apexName: 'example.com' }, verified: true, nameservers: ['ns1.vercel-dns.com', 'ns2.vercel-dns.com'], createdAt: 1704067200000, projectId },
        { name: 'www.example.com', apx: { apexName: 'example.com' }, verified: true, nameservers: ['ns1.vercel-dns.com', 'ns2.vercel-dns.com'], createdAt: 1704153600000, projectId },
      ],
    };
  }

  async add(projectId, domain) {
    return {
      success: true,
      data: {
        name: domain,
        apx: { apexName: domain },
        verified: false,
        nameservers: ['ns1.vercel-dns.com', 'ns2.vercel-dns.com'],
        createdAt: Date.now(),
        projectId,
        verification: [{ type: 'TXT', domain, value: 'verification-code' }],
      },
    };
  }

  async remove(projectId, domain) {
    return { success: true, message: `Domain ${domain} removed from project ${projectId}` };
  }
}

module.exports = { VercelDomains };
