/**
 * HeroUI v3 compatibility layer for existing v2 call sites.
 * Maps color/variant, compound structure, and removed hooks so screens
 * keep working while later phases restyle onto native v3 primitives.
 */
'use client';

import { Children, isValidElement, useState } from 'react';
import {
  Avatar as HeroAvatar,
  Button as HeroButton,
  Card as HeroCard,
  Checkbox as HeroCheckbox,
  CheckboxGroup,
  Chip as HeroChip,
  Description,
  Dropdown as HeroDropdown,
  FieldError,
  Input as HeroInput,
  InputGroup,
  Label,
  ListBox,
  Modal as HeroModal,
  Pagination as HeroPagination,
  ProgressBar,
  ProgressCircle,
  Radio as HeroRadio,
  RadioGroup as HeroRadioGroup,
  Select as HeroSelect,
  Separator,
  Switch as HeroSwitch,
  Tabs as HeroTabs,
  TextArea as HeroTextArea,
  TextField,
  Tooltip as HeroTooltip,
  useOverlayState,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { cn } from '@/utils/cn';

export {
  CheckboxGroup,
  Description,
  FieldError,
  InputGroup,
  Label,
  ListBox,
  TextField,
  useOverlayState,
};

export function HeroUIProvider({ children }) {
  return children;
}

export function useDisclosure(props = {}) {
  const state = useOverlayState(props);
  return {
    isOpen: state.isOpen,
    onOpen: state.open,
    onClose: state.close,
    onToggle: state.toggle,
    onOpenChange: state.setOpen,
  };
}

const V3_BUTTON_VARIANTS = new Set([
  'primary',
  'secondary',
  'tertiary',
  'outline',
  'ghost',
  'danger',
  'danger-soft',
]);

function mapButtonVariant(color, variant) {
  if (V3_BUTTON_VARIANTS.has(variant) && !color) return variant;
  if (variant === 'light' || variant === 'flat') {
    return color === 'danger' ? 'danger-soft' : 'tertiary';
  }
  if (variant === 'bordered' || variant === 'faded' || variant === 'outline') {
    return color === 'danger' ? 'danger-soft' : 'outline';
  }
  if (variant === 'ghost') return 'ghost';
  if (color === 'danger' || variant === 'danger') return 'danger';
  if (color === 'secondary' || variant === 'secondary') return 'secondary';
  if (color === 'default' && (variant === 'solid' || !variant)) return 'secondary';
  return 'primary';
}

function SpinnerGlyph({ size = 'sm', className, color }) {
  const mapped = color === 'primary' || color === 'current' ? 'accent' : color;
  return (
    <ProgressCircle
      isIndeterminate
      aria-label="Loading"
      size={size === 'lg' ? 'lg' : size === 'md' ? 'md' : 'sm'}
      color={mapped === 'accent' || mapped === 'success' || mapped === 'warning' || mapped === 'danger' ? mapped : 'accent'}
      className={className}
    >
      <ProgressCircle.Track>
        <ProgressCircle.TrackCircle />
        <ProgressCircle.FillCircle />
      </ProgressCircle.Track>
    </ProgressCircle>
  );
}

export function Spinner({ size, color, className, label = 'Loading' }) {
  return <SpinnerGlyph size={size} color={color} className={className} aria-label={label} />;
}

export function Button({
  color,
  variant,
  isLoading,
  isPending,
  startContent,
  endContent,
  children,
  className,
  href,
  fullWidth,
  classNames,
  disableRipple,
  disableAnimation,
  radius,
  spinner,
  spinnerPlacement,
  as: _as,
  ...rest
}) {
  const pending = Boolean(isPending || isLoading);
  const v3variant = mapButtonVariant(color, variant);
  return (
    <HeroButton
      variant={v3variant}
      isPending={pending}
      href={href}
      className={cn(fullWidth && 'w-full', classNames?.base, className)}
      {...rest}
    >
      {(renderProps) => (
        <>
          {(pending || renderProps?.isPending) && (
            <SpinnerGlyph size="sm" className="size-4" />
          )}
          {startContent}
          {typeof children === 'function' ? children(renderProps) : children}
          {endContent}
        </>
      )}
    </HeroButton>
  );
}
Button.displayName = 'Button';

function flattenButtonTrigger(node) {
  if (!isValidElement(node)) {
    return { content: node, triggerProps: {} };
  }
  const type = node.type;
  const isNative = type === 'button';
  const isCompatButton = type === Button || type?.displayName === 'Button';
  if (!isNative && !isCompatButton) {
    return { content: node, triggerProps: {} };
  }
  const { children, className, isDisabled, disabled, 'aria-label': ariaLabel } = node.props;
  return {
    content: children,
    triggerProps: {
      className,
      isDisabled: Boolean(isDisabled || disabled),
      'aria-label': ariaLabel,
    },
  };
}

function mapChipColor(color) {
  if (color === 'primary') return 'accent';
  if (color === 'secondary') return 'default';
  return color || 'default';
}

function mapChipVariant(variant) {
  if (variant === 'solid' || variant === 'shadow') return 'primary';
  if (variant === 'bordered' || variant === 'faded') return 'secondary';
  if (variant === 'light') return 'soft';
  if (variant === 'flat') return 'tertiary';
  if (variant === 'primary' || variant === 'secondary' || variant === 'tertiary' || variant === 'soft') {
    return variant;
  }
  return 'soft';
}

export function Chip({
  color,
  variant,
  startContent,
  endContent,
  children,
  className,
  classNames,
  onClose,
  avatar,
  radius,
  isDisabled,
  ...rest
}) {
  return (
    <HeroChip
      color={mapChipColor(color)}
      variant={mapChipVariant(variant)}
      className={cn(classNames?.base, className)}
      {...rest}
    >
      {avatar}
      {startContent}
      {children}
      {endContent}
    </HeroChip>
  );
}

export function Card(props) {
  return <HeroCard {...props} />;
}
export function CardHeader(props) {
  return <HeroCard.Header {...props} />;
}
export function CardBody(props) {
  return <HeroCard.Content {...props} />;
}
export function CardFooter(props) {
  return <HeroCard.Footer {...props} />;
}

export function Divider({ className, orientation = 'horizontal', ...rest }) {
  return <Separator orientation={orientation} className={className} {...rest} />;
}

const MODAL_SIZE = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'lg',
  '2xl': 'lg',
  '3xl': 'lg',
  '4xl': 'cover',
  '5xl': 'cover',
  full: 'full',
};

export function Modal({
  isOpen,
  onOpenChange,
  onClose,
  size = 'md',
  placement = 'center',
  backdrop = 'opaque',
  children,
  className,
  classNames,
  hideCloseButton,
  scrollBehavior,
  motionProps: _motion,
  ...rest
}) {
  const handleOpenChange = (open) => {
    onOpenChange?.(open);
    if (!open) onClose?.();
  };
  return (
    <HeroModal>
      <HeroModal.Backdrop
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        variant={backdrop === 'blur' ? 'blur' : backdrop === 'transparent' ? 'transparent' : 'opaque'}
        className={classNames?.backdrop}
        {...rest}
      >
        <HeroModal.Container
          size={MODAL_SIZE[size] || 'md'}
          placement={placement === 'bottom' ? 'bottom' : placement === 'top' ? 'top' : 'center'}
          scroll={scrollBehavior === 'outside' ? 'outside' : 'inside'}
          className={cn(classNames?.base, className)}
        >
          {children}
        </HeroModal.Container>
      </HeroModal.Backdrop>
    </HeroModal>
  );
}

export function ModalContent({ children }) {
  return (
    <HeroModal.Dialog>
      {(opts) => (typeof children === 'function' ? children(opts?.close) : children)}
    </HeroModal.Dialog>
  );
}

export function ModalHeader({ children, className }) {
  const isPlain = typeof children === 'string' || typeof children === 'number';
  return (
    <HeroModal.Header className={className}>
      {isPlain ? <HeroModal.Heading>{children}</HeroModal.Heading> : children}
    </HeroModal.Header>
  );
}

export function ModalBody(props) {
  return <HeroModal.Body {...props} />;
}

export function ModalFooter(props) {
  return <HeroModal.Footer {...props} />;
}

function firstKey(keys) {
  if (keys == null) return null;
  if (typeof keys === 'string' || typeof keys === 'number') return keys;
  if (keys instanceof Set) return [...keys][0] ?? null;
  if (Array.isArray(keys)) return keys[0] ?? null;
  return null;
}

function itemId(child, index) {
  if (child?.key != null && String(child.key).length) {
    return String(child.key).replace(/^(\.\$)+/, '').replace(/^\.+/,'');
  }
  return child?.props?.id ?? child?.props?.value ?? String(index);
}

export function Select({
  children,
  selectedKeys,
  onSelectionChange,
  value,
  onChange,
  label,
  placeholder,
  description,
  errorMessage,
  isInvalid,
  isRequired,
  isDisabled,
  className,
  classNames,
  selectionMode = 'single',
  labelPlacement: _lp,
  variant: _variant,
  color: _color,
  size: _size,
  ...rest
}) {
  const current = value ?? firstKey(selectedKeys);
  const handleChange = (next) => {
    onChange?.(next);
    if (onSelectionChange) {
      if (selectionMode === 'multiple') {
        onSelectionChange(new Set(Array.isArray(next) ? next : next == null ? [] : [next]));
      } else {
        onSelectionChange(new Set(next == null ? [] : [next]));
      }
    }
  };
  const items = Children.toArray(children).filter(isValidElement);
  const selectAriaLabel = rest['aria-label'] || (!label && placeholder) || undefined;
  return (
    <HeroSelect
      value={current ?? null}
      onChange={handleChange}
      placeholder={placeholder}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      className={cn(classNames?.base, className)}
      {...rest}
      aria-label={selectAriaLabel}
    >
      {label ? <Label>{label}</Label> : null}
      <HeroSelect.Trigger className={classNames?.trigger}>
        <HeroSelect.Value />
        <HeroSelect.Indicator />
      </HeroSelect.Trigger>
      {description ? <Description>{description}</Description> : null}
      <HeroSelect.Popover>
        <ListBox>
          {items.map((child, index) => {
            const id = itemId(child, index);
            const text =
              child.props.textValue ||
              (typeof child.props.children === 'string' ? child.props.children : String(id));
            return (
              <ListBox.Item key={id} id={id} textValue={text}>
                {child.props.children}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            );
          })}
        </ListBox>
      </HeroSelect.Popover>
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroSelect>
  );
}

export function SelectItem() {
  return null;
}

export function Input({
  label,
  description,
  errorMessage,
  isInvalid,
  isRequired,
  isDisabled,
  startContent,
  endContent,
  className,
  classNames,
  labelPlacement: _lp,
  variant: _variant,
  color: _color,
  radius: _radius,
  size: _size,
  fullWidth = true,
  ...rest
}) {
  const inputAriaLabel = rest['aria-label'] || (!label && rest.placeholder) || undefined;
  const field = (
    <TextField
      isInvalid={isInvalid}
      isRequired={isRequired}
      isDisabled={isDisabled}
      aria-label={inputAriaLabel}
      className={cn(fullWidth && 'w-full', classNames?.base, className)}
    >
      {label ? <Label>{label}</Label> : null}
      {startContent || endContent ? (
        <InputGroup>
          {startContent ? <InputGroup.Prefix>{startContent}</InputGroup.Prefix> : null}
          <InputGroup.Input className={classNames?.input} {...rest} />
          {endContent ? <InputGroup.Suffix>{endContent}</InputGroup.Suffix> : null}
        </InputGroup>
      ) : (
        <HeroInput className={classNames?.input} {...rest} />
      )}
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </TextField>
  );
  return field;
}

export function Textarea({
  label,
  description,
  errorMessage,
  isInvalid,
  isRequired,
  isDisabled,
  className,
  classNames,
  minRows,
  labelPlacement: _lp,
  ...rest
}) {
  return (
    <TextField
      isInvalid={isInvalid}
      isRequired={isRequired}
      isDisabled={isDisabled}
      className={cn(classNames?.base, className)}
    >
      {label ? <Label>{label}</Label> : null}
      <HeroTextArea rows={minRows} className={classNames?.input} {...rest} />
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </TextField>
  );
}

export function Switch({
  children,
  isSelected,
  onValueChange,
  onChange,
  className,
  ...rest
}) {
  return (
    <HeroSwitch
      isSelected={isSelected}
      onChange={onChange || onValueChange}
      className={className}
      {...rest}
    >
      <HeroSwitch.Control>
        <HeroSwitch.Thumb />
      </HeroSwitch.Control>
      {children ? <HeroSwitch.Content>{children}</HeroSwitch.Content> : null}
    </HeroSwitch>
  );
}

export function Checkbox({
  children,
  isSelected,
  onValueChange,
  onChange,
  className,
  ...rest
}) {
  return (
    <HeroCheckbox
      isSelected={isSelected}
      onChange={onChange || onValueChange}
      className={className}
      {...rest}
    >
      <HeroCheckbox.Control>
        <HeroCheckbox.Indicator />
      </HeroCheckbox.Control>
      {children ? <HeroCheckbox.Content>{children}</HeroCheckbox.Content> : null}
    </HeroCheckbox>
  );
}

export function Avatar({ src, name, size, className, classNames, showFallback = true, ...rest }) {
  const initial = name ? String(name).charAt(0).toUpperCase() : '?';
  return (
    <HeroAvatar size={size} className={cn(classNames?.base, className)} {...rest}>
      {src ? <HeroAvatar.Image src={src} alt={name || ''} /> : null}
      {showFallback ? (
        <HeroAvatar.Fallback className={classNames?.name}>{initial}</HeroAvatar.Fallback>
      ) : null}
    </HeroAvatar>
  );
}

export function Tooltip({ content, children, placement, className, color: _color, ...rest }) {
  if (!content) return children;
  const { content: triggerContent, triggerProps } = flattenButtonTrigger(children);
  return (
    <HeroTooltip {...rest}>
      <HeroTooltip.Trigger {...triggerProps}>{triggerContent}</HeroTooltip.Trigger>
      <HeroTooltip.Content placement={placement} className={className}>
        {content}
      </HeroTooltip.Content>
    </HeroTooltip>
  );
}

export function Tabs({
  children,
  selectedKey,
  onSelectionChange,
  'aria-label': ariaLabel,
  className,
  classNames,
  variant,
  color: _color,
  size: _size,
  fullWidth,
  ...rest
}) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <HeroTabs
      selectedKey={selectedKey}
      onSelectionChange={onSelectionChange}
      variant={variant === 'underlined' || variant === 'bordered' ? 'secondary' : 'primary'}
      className={cn(fullWidth && 'w-full', classNames?.base, className)}
      {...rest}
    >
      <HeroTabs.ListContainer className={classNames?.tabList}>
        <HeroTabs.List aria-label={ariaLabel || 'Tabs'}>
          {items.map((child, index) => {
            const id = itemId(child, index);
            return (
              <HeroTabs.Tab key={id} id={id} className={classNames?.tab}>
                {child.props.title}
                <HeroTabs.Indicator />
              </HeroTabs.Tab>
            );
          })}
        </HeroTabs.List>
      </HeroTabs.ListContainer>
      {items.map((child, index) => {
        const id = itemId(child, index);
        return (
          <HeroTabs.Panel key={id} id={id} className={classNames?.panel}>
            {child.props.children}
          </HeroTabs.Panel>
        );
      })}
    </HeroTabs>
  );
}

export function Tab() {
  return null;
}

function pageItems(total, page) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items = [1];
  if (page > 3) items.push('ellipsis-start');
  for (let p = Math.max(2, page - 1); p <= Math.min(total - 1, page + 1); p += 1) {
    items.push(p);
  }
  if (page < total - 2) items.push('ellipsis-end');
  items.push(total);
  return items;
}

export function Pagination({
  total = 1,
  page = 1,
  onChange,
  showControls = true,
  className,
  size = 'sm',
  ..._rest
}) {
  if (total < 1) return null;
  const items = pageItems(total, page);
  return (
    <HeroPagination size={size} className={className}>
      <HeroPagination.Content>
        {showControls ? (
          <HeroPagination.Item>
            <HeroPagination.Previous
              isDisabled={page <= 1}
              onPress={() => onChange?.(Math.max(1, page - 1))}
            >
              <HeroPagination.PreviousIcon />
            </HeroPagination.Previous>
          </HeroPagination.Item>
        ) : null}
        {items.map((item) =>
          typeof item === 'string' ? (
            <HeroPagination.Item key={item}>
              <HeroPagination.Ellipsis />
            </HeroPagination.Item>
          ) : (
            <HeroPagination.Item key={item}>
              <HeroPagination.Link isActive={item === page} onPress={() => onChange?.(item)}>
                {item}
              </HeroPagination.Link>
            </HeroPagination.Item>
          ),
        )}
        {showControls ? (
          <HeroPagination.Item>
            <HeroPagination.Next
              isDisabled={page >= total}
              onPress={() => onChange?.(Math.min(total, page + 1))}
            >
              <HeroPagination.NextIcon />
            </HeroPagination.Next>
          </HeroPagination.Item>
        ) : null}
      </HeroPagination.Content>
    </HeroPagination>
  );
}

export function Dropdown({ children, ...rest }) {
  const items = Children.toArray(children);
  let trigger = null;
  const restChildren = [];
  items.forEach((child) => {
    if (isValidElement(child) && child.type?.displayName === 'DropdownTrigger') {
      trigger = child.props.children;
    } else {
      restChildren.push(child);
    }
  });
  const { content: triggerContent, triggerProps } = flattenButtonTrigger(trigger);
  return (
    <HeroDropdown {...rest}>
      <HeroDropdown.Trigger {...triggerProps}>{triggerContent}</HeroDropdown.Trigger>
      {restChildren}
    </HeroDropdown>
  );
}

export function DropdownTrigger({ children }) {
  return children;
}
DropdownTrigger.displayName = 'DropdownTrigger';

export function DropdownMenu({ children, onAction, className, 'aria-label': ariaLabel, ...rest }) {
  return (
    <HeroDropdown.Popover>
      <HeroDropdown.Menu onAction={onAction} aria-label={ariaLabel} className={className} {...rest}>
        {children}
      </HeroDropdown.Menu>
    </HeroDropdown.Popover>
  );
}

export function DropdownItem({
  children,
  startContent,
  endContent,
  color,
  className,
  textValue,
  ...rest
}) {
  const id = rest.id ?? rest.key;
  const label = textValue || (typeof children === 'string' ? children : undefined);
  return (
    <HeroDropdown.Item
      id={id}
      textValue={label || String(id || '')}
      variant={color === 'danger' ? 'danger' : undefined}
      className={className}
      {...rest}
    >
      {startContent}
      {typeof children === 'string' ? <Label>{children}</Label> : children}
      {endContent}
    </HeroDropdown.Item>
  );
}

export function DatePicker({
  label,
  value,
  onChange,
  isRequired,
  isDisabled,
  description,
  errorMessage,
  isInvalid,
  className,
  placeholder: _placeholder,
  labelPlacement: _lp,
  classNames: _cn,
  ...rest
}) {
  const iso =
    value && typeof value === 'object' && value.year
      ? `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
      : typeof value === 'string'
        ? value
        : '';
  return (
    <TextField
      isRequired={isRequired}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      className={className}
      {...rest}
    >
      {label ? <Label>{label}</Label> : null}
      <HeroInput
        type="date"
        value={iso}
        onChange={(event) => {
          const next = event.target.value;
          if (!next) {
            onChange?.(null);
            return;
          }
          onChange?.(parseDate(next));
        }}
      />
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </TextField>
  );
}

export function Skeleton({ className, ...rest }) {
  return <div className={cn('animate-pulse rounded-md bg-gray-200', className)} {...rest} />;
}

export function Progress({ value = 0, className, color }) {
  const mapped =
    color === 'danger' || color === 'success' || color === 'warning' ? color : 'accent';
  return (
    <ProgressBar value={value} color={mapped} className={className} aria-label="Progress">
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  );
}

export function RadioGroup({ children, className, ...rest }) {
  return (
    <HeroRadioGroup className={className} {...rest}>
      {children}
    </HeroRadioGroup>
  );
}

export function Radio({ children, description, className, ...rest }) {
  return (
    <HeroRadio className={className} {...rest}>
      <HeroRadio.Control>
        <HeroRadio.Indicator />
      </HeroRadio.Control>
      <HeroRadio.Content>
        {children}
        {description ? <span className="block text-xs text-gray-500">{description}</span> : null}
      </HeroRadio.Content>
    </HeroRadio>
  );
}

export function Table({ children, className, 'aria-label': ariaLabel }) {
  return (
    <table className={cn('w-full text-sm', className)} aria-label={ariaLabel}>
      {children}
    </table>
  );
}

export function TableHeader({ children }) {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  );
}

export function TableColumn({ children, className, width }) {
  return (
    <th className={cn('text-left px-3 py-2', className)} style={width ? { width } : undefined}>
      {children}
    </th>
  );
}

export function TableBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }) {
  return <tr>{children}</tr>;
}

export function TableCell({ children, colSpan, className }) {
  return (
    <td colSpan={colSpan} className={cn('px-3 py-2', className)}>
      {children}
    </td>
  );
}

export function Autocomplete({
  items = [],
  children,
  inputValue,
  onInputChange,
  onSelectionChange,
  label,
  placeholder,
  startContent,
  isRequired,
  isLoading,
  className,
  classNames,
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('relative', classNames?.base, className)}>
      <Input
        label={label}
        placeholder={placeholder}
        value={inputValue}
        onChange={(event) => onInputChange?.(event.target.value)}
        startContent={startContent}
        isRequired={isRequired}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        endContent={isLoading ? <SpinnerGlyph size="sm" className="size-4" /> : null}
      />
      {open && items.length > 0 ? (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-50"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelectionChange?.(String(item.id));
                  setOpen(false);
                }}
              >
                {typeof children === 'function' ? children(item) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AutocompleteItem({ children }) {
  return children;
}
