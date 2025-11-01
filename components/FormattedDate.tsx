'use client';

import { useState, useEffect } from 'react';

interface FormattedDateProps {
  dateString: string;
}

export default function FormattedDate({ dateString }: FormattedDateProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!dateString) return null;

  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Render a placeholder on the server and on the initial client render
  if (!isClient) {
    // A basic format that is consistent across server/client
    return <span>{date.toISOString().split('T')[0]}</span>;
  }

  // Render the full, locale-specific date only on the client after hydration
  return <span suppressHydrationWarning>{formattedDate}</span>;
}
