import { Spin } from 'antd';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../../store';

const BusyOverlay = observer(function BusyOverlay() {
  const { uiStore } = useStore();
  if (!uiStore.isBusy) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
      <Spin size="large" />
    </div>
  );
});

export default BusyOverlay;
