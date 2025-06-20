import { Link } from 'rspress/theme';
import styles from './Overview.module.scss';
import { useI18nUrl } from './utils';

export interface GroupItem {
  text: string;
  link: string;
}

export interface Group {
  name: string;
  items: GroupItem[];
}

declare const OVERVIEW_GROUPS: Group[];

export default function Overview() {
  const tUrl = useI18nUrl();

  const Nodes = OVERVIEW_GROUPS.map((group) => (
    <div key={group.name} className={styles.overviewGroups}>
      <div className={styles.group}>
        <h2>{group.name}</h2>
        <ul>
          {group.items.map((item) => (
            <li key={item.text}>
              <Link href={tUrl(item.link)}>{item.text}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  ));

  return <div className={styles.root}>{Nodes}</div>;
}
