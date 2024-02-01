import { strAdd } from '@e2e/source-build-utils';
import './index.less';

export interface CardProps {
  title: string;
  content?: string;
}

export const Card = (props: CardProps) => {
  const { title, content = '' } = props;
  return (
    <div className="card-comp">
      <h2>Card Comp Title: {title}</h2>
      <article>{strAdd('Card Comp Content:', content)}</article>
    </div>
  );
};
