import { Link } from 'rspress/theme';
import { useUrl } from '../utils';
import styles from './Step.module.scss';

const Step = (props: { href: string; title: string; description: string }) => {
  return (
    <Link className={styles.step} href={useUrl(props.href)}>
      <p className={styles.title}>{props.title}</p>
      <p className={styles.description}>{props.description}</p>
    </Link>
  );
};

export default Step;
