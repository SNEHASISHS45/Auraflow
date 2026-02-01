
export const downloadService = {
  async downloadImage(url: string, filename: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename.endsWith('.jpg') ? filename : `${filename}.jpg`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback for cross-origin issues: open in new tab
      window.open(url, '_blank');
      return false;
    }
  },

  async shareImage(title: string, url: string) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AuraFlow | ${title}`,
          text: `Check out this amazing aura: ${title}`,
          url: url,
        });
        return true;
      } catch (err) {
        return false;
      }
    }
    return false;
  }
};
