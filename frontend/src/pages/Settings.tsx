import Card from '../components/common/Card';
import PageHeader from '../components/common/PageHeader';

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" />
      <Card>
        <p className="text-sm text-slate-600">
          Settings will be available in a future version.
        </p>
      </Card>
    </div>
  );
}