
// app/solar/[id]/page.tsx
import SolarPage from './SolarPage';

export default function Page({ params }: { params: { id: string } }) {
  // Pass the numeric id down; your API expects numbers not strings
  return <SolarPage id={params.id} />;
}

