import { Link } from 'rspress/theme';
import styles from './Step.module.scss';
import { useUrl } from './utils';

const Step = (props: { href: string; title: string; description: string }) => {
  const isExternal = props.href.startsWith('http');
  return (
    <Link
      className={styles.step}
      href={isExternal ? props.href : useUrl(props.href)}
    >
      <p className={styles.title}>{props.title}</p>
      <p className={styles.description}>{props.description}</p>
    </Link>
  );
};

export default Step;
